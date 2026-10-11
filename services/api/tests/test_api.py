import json
import os

from fastapi.testclient import TestClient

from app import main as main_module


TEST_INTERNAL_TOKEN = (
    "test-internal-token"
)

os.environ[
    "INTERNAL_API_TOKEN"
] = TEST_INTERNAL_TOKEN


client = TestClient(
    main_module.app
)


def valid_request():
    return {
        "apiKey":
            "fake-user-api-key",

        "provider":
            "deepseek",

        "model":
            "deepseek-chat",

        "systemInstruction":
            "Test system prompt",

        "userMessage":
            '待分析句子: "Ich bin müde."',
    }


def test_health():
    response = client.get(
        "/health"
    )

    assert (
        response.status_code
        == 200
    )

    data = response.json()

    assert (
        data["status"]
        == "ok"
    )

    assert (
        data["version"]
        == "2.0.0"
    )


def test_analyze_requires_internal_token():
    response = client.post(
        "/analyze",
        json=valid_request(),
    )

    assert (
        response.status_code
        == 401
    )


def test_invalid_request_schema():
    response = client.post(
        "/analyze",

        headers={
            "x-internal-token":
                TEST_INTERNAL_TOKEN
        },

        json={
            "provider":
                "deepseek"
        },
    )

    assert (
        response.status_code
        == 422
    )


def test_valid_analysis_with_mock_provider(
    monkeypatch,
):
    """
    No real LLM API call is made.

    We replace call_provider()
    with a fake provider response.
    """

    fake_response = {
        "correctedSentence":
            None,

        "words": [
            {
                "original":
                    "Ich",

                "morphemes": [
                    {
                        "text":
                            "Ich",

                        "type":
                            "none",
                    }
                ],

                "morphemeLogics":
                    [],

                "gloss":
                    "1SG.NOM",

                "glossLogics": [
                    {
                        "part":
                            "1SG",

                        "meaning":
                            "第一人称单数",
                    },

                    {
                        "part":
                            "NOM",

                        "meaning":
                            "主格",
                    },
                ],

                "translation":
                    "我",
            }
        ],

        "overallTranslation":
            "我很累。",
    }

    async def fake_call_provider(
        request,
    ):
        return json.dumps(
            fake_response,
            ensure_ascii=False,
        )

    monkeypatch.setattr(
        main_module,
        "call_provider",
        fake_call_provider,
    )

    response = client.post(
        "/analyze",

        headers={
            "x-internal-token":
                TEST_INTERNAL_TOKEN
        },

        json=valid_request(),
    )

    assert (
        response.status_code
        == 200
    )

    data = response.json()

    assert (
        data[
            "overallTranslation"
        ]
        == "我很累。"
    )

    assert (
        data["words"][0][
            "gloss"
        ]
        == "1SG.NOM"
    )


def test_invalid_model_output_is_caught(
    monkeypatch,
):
    async def fake_bad_provider(
        request,
    ):
        return json.dumps({
            "hello":
                "this is not a valid LinguiSnap analysis"
        })

    monkeypatch.setattr(
        main_module,
        "call_provider",
        fake_bad_provider,
    )

    response = client.post(
        "/analyze",

        headers={
            "x-internal-token":
                TEST_INTERNAL_TOKEN
        },

        json=valid_request(),
    )

    assert (
        response.status_code
        == 502
    )