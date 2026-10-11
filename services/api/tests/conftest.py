import httpx
import pytest
from fastapi.testclient import TestClient

from app import main


@pytest.fixture(autouse=True)
def block_external_http(monkeypatch):
    """A forgotten mock must fail rather than contact a paid provider."""
    for name in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"):
        monkeypatch.delenv(name, raising=False)

    async def blocked(*args, **kwargs):
        raise AssertionError("External HTTP is forbidden in unit tests")

    monkeypatch.setattr(httpx.AsyncClient, "send", blocked)


@pytest.fixture
def api_client(monkeypatch):
    monkeypatch.setenv("INTERNAL_API_TOKEN", "test-internal-token")
    with TestClient(main.app, raise_server_exceptions=False) as client:
        yield client


@pytest.fixture
def auth_headers():
    return {"x-internal-token": "test-internal-token"}


@pytest.fixture
def request_body():
    return {
        "apiKey": "sentinel-secret-never-return-this",
        "provider": "deepseek",
        "model": "deepseek-chat",
        "systemInstruction": "Return a language analysis as JSON.",
        "userMessage": "Ich bin müde.",
    }


@pytest.fixture
def analysis():
    return {
        "correctedSentence": None,
        "words": [{
            "original": "Ich",
            "morphemes": [{"text": "Ich", "type": "none"}],
            "morphemeLogics": [],
            "gloss": "1SG.NOM",
            "glossLogics": [{"part": "1SG", "meaning": "first person singular"}],
            "translation": "I",
        }],
        "overallTranslation": "I am tired.",
    }
