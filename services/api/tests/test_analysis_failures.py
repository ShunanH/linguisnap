import json

import pytest

from app import main


@pytest.mark.parametrize("token", [None, "wrong-token", ""])
def test_unauthorized_requests_never_call_provider(monkeypatch, api_client, request_body, token):
    async def forbidden(request):
        pytest.fail("Provider called before authentication")

    monkeypatch.setattr(main, "call_provider", forbidden)
    headers = {} if token is None else {"x-internal-token": token}
    assert api_client.post("/analyze", json=request_body, headers=headers).status_code == 401


def test_missing_service_token_is_configuration_error(monkeypatch, api_client, request_body, auth_headers):
    monkeypatch.delenv("INTERNAL_API_TOKEN")
    assert api_client.post("/analyze", json=request_body, headers=auth_headers).status_code == 500


@pytest.mark.parametrize("error,status", [
    (main.ProviderError(401), 401),
    (main.ProviderError(403), 401),
    (main.ProviderError(400), 400),
    (main.ProviderError(502), 502),
    (main.TransientProviderError(429), 429),
    (main.TransientProviderError(503), 503),
])
def test_provider_errors_have_safe_public_responses(monkeypatch, api_client, request_body, auth_headers, caplog, error, status):
    async def fail(request):
        raise error

    monkeypatch.setattr(main, "call_provider", fail)
    response = api_client.post("/analyze", json=request_body, headers=auth_headers)
    assert response.status_code == status
    assert isinstance(response.json()["detail"], str)
    assert request_body["apiKey"] not in response.text + caplog.text


@pytest.mark.parametrize("output", ["", "not JSON", "{", "null", "[]", '{"hello": "world"}'])
def test_malformed_model_outputs_are_controlled(monkeypatch, api_client, request_body, auth_headers, output):
    async def respond(request):
        return output

    monkeypatch.setattr(main, "call_provider", respond)
    response = api_client.post("/analyze", json=request_body, headers=auth_headers)
    assert response.status_code == 502
    assert isinstance(response.json()["detail"], str)


@pytest.mark.parametrize("fence", ["", "```json\n{}\n```", "```JSON\n{}\n```", "```\n{}\n```"])
def test_valid_outputs_with_optional_markdown_fence(monkeypatch, api_client, request_body, auth_headers, analysis, fence):
    text = json.dumps(analysis)

    async def respond(request):
        return fence.format(text) if fence else text

    monkeypatch.setattr(main, "call_provider", respond)
    response = api_client.post("/analyze", json=request_body, headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == analysis


@pytest.mark.parametrize("field,value", [("provider", "unknown"), ("apiKey", ""), ("model", ""), ("userMessage", "")])
def test_bad_requests_do_not_reach_provider(monkeypatch, api_client, request_body, auth_headers, field, value):
    async def forbidden(request):
        pytest.fail("Invalid request reached provider")

    monkeypatch.setattr(main, "call_provider", forbidden)
    request_body[field] = value
    assert api_client.post("/analyze", json=request_body, headers=auth_headers).status_code == 422
