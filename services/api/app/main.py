import asyncio
import json
import math
import os
import re
import secrets
from urllib.parse import quote

import httpx
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from fastapi import (
    FastAPI,
    Header,
    HTTPException,
)

from pydantic import (
    ValidationError,
)

from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from .schemas import (
    AnalyzeRequest,
    SentenceAnalysis,
)


app = FastAPI(
    title="LinguiSnap AI API",
    version="2.0.0",
)


@app.exception_handler(RequestValidationError)
async def invalid_request_handler(request, exc):
    # Validation details can contain API keys, even inside malformed JSON.
    return JSONResponse(status_code=422, content={"detail": "Invalid analysis request."})


def analysis_timeout_seconds() -> float:
    try:
        value = float(os.getenv("ANALYSIS_TIMEOUT_SECONDS", "50"))
    except ValueError:
        value = float("nan")
    if not math.isfinite(value) or not 0 < value <= 55:
        raise HTTPException(status_code=500, detail="Invalid analysis timeout configuration.")
    return value


class ProviderError(
    Exception
):
    def __init__(
        self,
        status_code: int,
    ):
        super().__init__(
            f"Provider HTTP {status_code}"
        )

        self.status_code = (
            status_code
        )


class TransientProviderError(
    ProviderError
):
    pass


def verify_internal_token(
    token: str | None,
):
    expected = os.getenv(
        "INTERNAL_API_TOKEN"
    )

    if not expected:
        raise HTTPException(
            status_code=500,
            detail=(
                "Internal service authentication "
                "is not configured."
            ),
        )

    if (
        token is None
        or not secrets.compare_digest(
            token,
            expected,
        )
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "Unauthorized internal request."
            ),
        )


def clean_json_text(
    value: str,
) -> str:
    value = value.strip()

    value = re.sub(
        r"^```json\s*",
        "",
        value,
        flags=re.IGNORECASE,
    )

    value = re.sub(
        r"^```\s*",
        "",
        value,
    )

    value = re.sub(
        r"\s*```$",
        "",
        value,
    )

    return value.strip()


@retry(
    retry=retry_if_exception_type(
        TransientProviderError
    ),
    stop=stop_after_attempt(3),
    wait=wait_exponential(
        multiplier=1,
        min=1,
        max=8,
    ),
    reraise=True,
)
async def post_provider_json(
    *,
    url: str,
    headers: dict[str, str],
    payload: dict,
) -> dict:
    """
    Provider HTTP wrapper.

    Retries only temporary failures:
    - network failures
    - timeout
    - HTTP 429
    - HTTP 5xx

    Authentication errors are NOT retried.
    """

    try:
        async with (
            httpx.AsyncClient(
                timeout=45.0
            ) as client
        ):
            response = (
                await client.post(
                    url,
                    headers=headers,
                    json=payload,
                )
            )

    except (
        httpx.TimeoutException,
        httpx.NetworkError,
    ):
        raise (
            TransientProviderError(
                503
            )
        )

    if (
        response.status_code
        == 429
        or response.status_code
        >= 500
    ):
        raise (
            TransientProviderError(
                response.status_code
            )
        )

    if (
        response.status_code
        >= 400
    ):
        raise ProviderError(
            response.status_code
        )

    try:
        data = response.json()
        if not isinstance(data, dict):
            raise ProviderError(502)
        return data

    except ValueError:
        raise ProviderError(
            502
        )


async def call_openai(
    request: AnalyzeRequest,
) -> str:
    data = await post_provider_json(
        url=(
            "https://api.openai.com/"
            "v1/chat/completions"
        ),
        headers={
            "Authorization":
                f"Bearer {request.apiKey}",
            "Content-Type":
                "application/json",
        },
        payload={
            "model":
                request.model,
            "temperature": 0.1,
            "response_format": {
                "type":
                    "json_object"
            },
            "messages": [
                {
                    "role":
                        "system",
                    "content":
                        request.systemInstruction,
                },
                {
                    "role":
                        "user",
                    "content":
                        request.userMessage,
                },
            ],
        },
    )

    try:
        return (
            data["choices"][0]
            ["message"]["content"]
        )

    except (
        KeyError,
        IndexError,
        TypeError,
    ):
        raise ProviderError(
            502
        )


async def call_deepseek(
    request: AnalyzeRequest,
) -> str:
    data = await post_provider_json(
        url=(
            "https://api.deepseek.com/"
            "chat/completions"
        ),
        headers={
            "Authorization":
                f"Bearer {request.apiKey}",
            "Content-Type":
                "application/json",
        },
        payload={
            "model":
                request.model,
            "temperature": 0.1,
            "response_format": {
                "type":
                    "json_object"
            },
            "messages": [
                {
                    "role":
                        "system",
                    "content":
                        request.systemInstruction,
                },
                {
                    "role":
                        "user",
                    "content":
                        request.userMessage,
                },
            ],
        },
    )

    try:
        return (
            data["choices"][0]
            ["message"]["content"]
        )

    except (
        KeyError,
        IndexError,
        TypeError,
    ):
        raise ProviderError(
            502
        )


async def call_anthropic(
    request: AnalyzeRequest,
) -> str:
    data = await post_provider_json(
        url=(
            "https://api.anthropic.com/"
            "v1/messages"
        ),
        headers={
            "x-api-key":
                request.apiKey,
            "anthropic-version":
                "2023-06-01",
            "Content-Type":
                "application/json",
        },
        payload={
            "model":
                request.model,
            "max_tokens": 8192,
            "temperature": 0.1,
            "system":
                request.systemInstruction,
            "messages": [
                {
                    "role":
                        "user",
                    "content":
                        request.userMessage,
                }
            ],
        },
    )

    try:
        for block in (
            data["content"]
        ):
            if (
                isinstance(block, dict) and block.get(
                    "type"
                )
                == "text"
            ):
                return block[
                    "text"
                ]

    except (
        KeyError,
        TypeError,
    ):
        pass

    raise ProviderError(
        502
    )


async def call_gemini(
    request: AnalyzeRequest,
) -> str:
    model_name = quote(
        request.model,
        safe="",
    )

    data = await post_provider_json(
        url=(
            "https://generativelanguage."
            "googleapis.com/v1beta/models/"
            f"{model_name}:generateContent"
        ),
        headers={
            "x-goog-api-key":
                request.apiKey,
            "Content-Type":
                "application/json",
        },
        payload={
            "systemInstruction": {
                "parts": [
                    {
                        "text":
                            request.systemInstruction
                    }
                ]
            },

            "contents": [
                {
                    "role":
                        "user",
                    "parts": [
                        {
                            "text":
                                request.userMessage
                        }
                    ],
                }
            ],

            "generationConfig": {
                "temperature":
                    0.1,

                "responseMimeType":
                    "application/json",
            },
        },
    )

    try:
        return (
            data["candidates"][0]
            ["content"]["parts"][0]
            ["text"]
        )

    except (
        KeyError,
        IndexError,
        TypeError,
    ):
        raise ProviderError(
            502
        )


async def call_provider(
    request: AnalyzeRequest,
) -> str:
    if (
        request.provider
        == "openai"
    ):
        return (
            await call_openai(
                request
            )
        )

    if (
        request.provider
        == "deepseek"
    ):
        return (
            await call_deepseek(
                request
            )
        )

    if (
        request.provider
        == "anthropic"
    ):
        return (
            await call_anthropic(
                request
            )
        )

    if (
        request.provider
        == "gemini"
    ):
        return (
            await call_gemini(
                request
            )
        )

    raise ProviderError(
        400
    )


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service":
            "linguisnap-ai-api",
        "version": "2.0.0",
    }


@app.post(
    "/analyze",
    response_model=
        SentenceAnalysis,
)
async def analyze(
    request: AnalyzeRequest,

    x_internal_token:
        str | None =
        Header(default=None),
):
    verify_internal_token(
        x_internal_token
    )

    try:
        timeout = analysis_timeout_seconds()
        response_text = await asyncio.wait_for(
            call_provider(request), timeout=timeout
        )

        if not isinstance(response_text, str) or not response_text.strip():
            raise ProviderError(
                502
            )

        cleaned = (
            clean_json_text(
                response_text
            )
        )

        try:
            raw_data = (
                json.loads(
                    cleaned
                )
            )

        except json.JSONDecodeError:
            raise HTTPException(
                status_code=502,
                detail=(
                    "AI 返回的数据不是有效 JSON，"
                    "请重新解析一次。"
                ),
            )

        try:
            analysis = (
                SentenceAnalysis
                .model_validate(
                    raw_data
                )
            )

        except ValidationError:
            raise HTTPException(
                status_code=502,
                detail=(
                    "AI 返回的数据不符合 "
                    "LinguiSnap 的分析结构，"
                    "请重新解析一次。"
                ),
            )

        return analysis

    except TimeoutError:
        raise HTTPException(status_code=504, detail="AI 服务响应超时，请稍后重试。") from None

    except HTTPException:
        raise

    except TransientProviderError as exc:
        if (
            exc.status_code
            == 429
        ):
            raise HTTPException(
                status_code=429,
                detail=(
                    "模型服务当前请求过多或额度不足，"
                    "请稍后再试。"
                ),
            )

        raise HTTPException(
            status_code=503,
            detail=(
                "模型服务暂时不可用，"
                "请稍后重试。"
            ),
        )

    except ProviderError as exc:
        if (
            exc.status_code
            in (401, 403)
        ):
            raise HTTPException(
                status_code=401,
                detail=(
                    "API Key 无效、已失效，"
                    "或没有访问该模型的权限。"
                ),
            )

        if (
            exc.status_code
            == 400
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "模型请求参数无效。"
                ),
            )

        raise HTTPException(
            status_code=502,
            detail=(
                "模型服务返回了异常响应，"
                "请稍后重试。"
            ),
        )
