def test_internal_health_rejects_missing_token(api_client):
    assert api_client.get('/internal/health').status_code == 401


def test_internal_health_rejects_wrong_token(api_client):
    assert api_client.get('/internal/health', headers={'x-internal-token': 'wrong'}).status_code == 401


def test_internal_health_accepts_token_without_calling_provider(api_client, auth_headers):
    response = api_client.get('/internal/health', headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == {'status': 'ok', 'service': 'linguisnap-ai-api'}
