import asyncio

import httpx
import pytest
from tenacity import wait_none

from app import main


URL = "https://provider.example/analyze"


def install_responses(monkeypatch, outcomes):
    calls = []

    async def post(self, url, **kwargs):
        calls.append((url, kwargs))
        if len(calls) > len(outcomes):
            raise AssertionError("Unexpected extra provider request")
        outcome = outcomes[len(calls) - 1]
        if isinstance(outcome, Exception):
            raise outcome
        status, body = outcome
        return httpx.Response(status, json=body, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    return calls


def invoke():
    # Preserve production retry predicates/counts, remove wall-clock backoff only.
    call = main.post_provider_json.retry_with(wait=wait_none())
    return asyncio.run(call(url=URL, headers={"Authorization": "Bearer fake"}, payload={"model": "test"}))


@pytest.mark.parametrize("status", [400, 401, 403, 404, 422])
def test_permanent_errors_are_not_retried(monkeypatch, status):
    calls = install_responses(monkeypatch, [(status, {"error": "rejected"})])
    with pytest.raises(main.ProviderError) as caught:
        invoke()
    assert caught.value.status_code == status
    assert not isinstance(caught.value, main.TransientProviderError)
    assert len(calls) == 1


@pytest.mark.parametrize("status", [429, 500, 502, 503, 504])
def test_transient_failure_then_success(monkeypatch, status):
    calls = install_responses(monkeypatch, [(status, {}), (200, {"result": "ok"})])
    assert invoke() == {"result": "ok"}
    assert len(calls) == 2
    assert calls[0] == calls[1]


@pytest.mark.parametrize("status", [429, 503])
def test_transient_failure_stops_after_three_attempts(monkeypatch, status):
    calls = install_responses(monkeypatch, [(status, {})] * 3)
    with pytest.raises(main.TransientProviderError) as caught:
        invoke()
    assert caught.value.status_code == status
    assert len(calls) == 3


@pytest.mark.parametrize("error", [httpx.ReadTimeout, httpx.ConnectError])
def test_transport_failure_recovers(monkeypatch, error):
    calls = install_responses(monkeypatch, [error("simulated"), (200, {"ok": True})])
    assert invoke() == {"ok": True}
    assert len(calls) == 2


def test_invalid_http_json_is_not_retried(monkeypatch):
    calls = 0

    async def post(self, url, **kwargs):
        nonlocal calls
        calls += 1
        return httpx.Response(200, text="<html>upstream error</html>")

    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    with pytest.raises(main.ProviderError) as caught:
        invoke()
    assert caught.value.status_code == 502
    assert calls == 1


def test_cancellation_is_not_retried(monkeypatch):
    calls = install_responses(monkeypatch, [])

    async def cancelled(self, url, **kwargs):
        calls.append(url)
        raise asyncio.CancelledError

    monkeypatch.setattr(httpx.AsyncClient, "post", cancelled)
    with pytest.raises(asyncio.CancelledError):
        invoke()
    assert len(calls) == 1
