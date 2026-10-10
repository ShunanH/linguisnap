"""Regression tests for repaired API boundary failures."""
import asyncio
import time

import httpx
import pytest
from tenacity import wait_fixed

from app import main


@pytest.mark.parametrize("content", [{"unexpected": "object"}, ["unexpected list"], 123])
def test_non_string_model_content_returns_502(monkeypatch, api_client, request_body, auth_headers, content):
    async def respond(request):
        return content

    monkeypatch.setattr(main, "call_provider", respond)
    assert api_client.post("/analyze", json=request_body, headers=auth_headers).status_code == 502


def test_invalid_key_field_is_redacted(monkeypatch, api_client, request_body, auth_headers, caplog):
    sentinel = request_body["apiKey"]
    request_body["apiKey"] = {"accidentally_nested_key": sentinel}
    response = api_client.post("/analyze", json=request_body, headers=auth_headers)
    assert response.status_code == 422
    assert sentinel not in response.text + caplog.text


def test_total_deadline_returns_504(monkeypatch, api_client, request_body, auth_headers):
    monkeypatch.setenv("ANALYSIS_TIMEOUT_SECONDS", "0.01")

    async def slow(request):
        await asyncio.sleep(0.05)
        return "{}"

    monkeypatch.setattr(main, "call_provider", slow)
    response = api_client.post("/analyze", json=request_body, headers=auth_headers)
    assert response.status_code == 504


@pytest.mark.parametrize("value", ["0", "-1", "nan", "inf", "60", "invalid"])
def test_invalid_timeout_configuration_does_not_call_provider(monkeypatch, api_client, request_body, auth_headers, value):
    monkeypatch.setenv("ANALYSIS_TIMEOUT_SECONDS", value)

    async def forbidden(request):
        pytest.fail("Invalid timeout configuration reached provider")

    monkeypatch.setattr(main, "call_provider", forbidden)
    assert api_client.post("/analyze", json=request_body, headers=auth_headers).status_code == 500


def test_deadline_cancels_inflight_provider(monkeypatch, api_client, request_body, auth_headers):
    monkeypatch.setenv("ANALYSIS_TIMEOUT_SECONDS", "0.05")
    events = []

    async def post(self, url, **kwargs):
        events.append("started")
        try:
            await asyncio.sleep(10)
        finally:
            events.append("cancelled")

    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    started = time.monotonic()
    response = api_client.post("/analyze", json=request_body, headers=auth_headers)
    assert response.status_code == 504
    assert events == ["started", "cancelled"]
    assert time.monotonic() - started < 2


def test_deadline_interrupts_retry_backoff(monkeypatch, api_client, request_body, auth_headers):
    monkeypatch.setenv("ANALYSIS_TIMEOUT_SECONDS", "0.05")
    calls = []

    async def post(self, url, **kwargs):
        calls.append(url)
        return httpx.Response(503, json={})

    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    monkeypatch.setattr(main, "post_provider_json", main.post_provider_json.retry_with(wait=wait_fixed(10)))
    started = time.monotonic()
    response = api_client.post("/analyze", json=request_body, headers=auth_headers)
    assert response.status_code == 504
    assert len(calls) == 1
    assert time.monotonic() - started < 2
