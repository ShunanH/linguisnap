import asyncio
import json

import httpx
import pytest

from app import main
from app.schemas import AnalyzeRequest


@pytest.mark.parametrize("provider,host,auth_header", [
    ("openai", "api.openai.com", "Authorization"),
    ("deepseek", "api.deepseek.com", "Authorization"),
    ("anthropic", "api.anthropic.com", "x-api-key"),
    ("gemini", "generativelanguage.googleapis.com", "x-goog-api-key"),
])
def test_provider_http_contract(monkeypatch, request_body, analysis, provider, host, auth_header):
    content = json.dumps(analysis)
    envelopes = {
        "openai": {"choices": [{"message": {"content": content}}]},
        "deepseek": {"choices": [{"message": {"content": content}}]},
        "anthropic": {"content": [{"type": "text", "text": content}]},
        "gemini": {"candidates": [{"content": {"parts": [{"text": content}]}}]},
    }
    calls = []

    async def post(self, url, **kwargs):
        calls.append((url, kwargs))
        return httpx.Response(200, json=envelopes[provider])

    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    request_body["provider"] = provider
    request = AnalyzeRequest(**request_body)
    assert json.loads(asyncio.run(main.call_provider(request))) == analysis
    assert len(calls) == 1
    url, kwargs = calls[0]
    assert httpx.URL(url).host == host
    assert request.apiKey in kwargs["headers"][auth_header]
    assert request.apiKey not in url
    payload = kwargs["json"]
    assert request.apiKey not in json.dumps(payload)
    if provider in ("openai", "deepseek"):
        assert payload["model"] == request.model
        assert payload["messages"] == [
            {"role": "system", "content": request.systemInstruction},
            {"role": "user", "content": request.userMessage},
        ]
    elif provider == "anthropic":
        assert payload["model"] == request.model
        assert payload["system"] == request.systemInstruction
        assert payload["messages"][0]["content"] == request.userMessage
    else:
        assert request.model in url
        assert payload["systemInstruction"]["parts"][0]["text"] == request.systemInstruction
        assert payload["contents"][0]["parts"][0]["text"] == request.userMessage


@pytest.mark.parametrize("provider", ["openai", "deepseek", "anthropic", "gemini"])
def test_missing_provider_response_fields(monkeypatch, request_body, provider):
    async def post(self, url, **kwargs):
        return httpx.Response(200, json={})

    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    request_body["provider"] = provider
    with pytest.raises(main.ProviderError) as caught:
        asyncio.run(main.call_provider(AnalyzeRequest(**request_body)))
    assert caught.value.status_code == 502
