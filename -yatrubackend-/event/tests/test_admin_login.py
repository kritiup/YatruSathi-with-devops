"""Built-in admin login (`POST /api/admin/login/`).

Credentials come from ADMIN_EMAIL / ADMIN_PASSWORD env vars, read into module
constants at import time — so the tests patch the constants directly.
"""

import pytest

pytestmark = pytest.mark.django_db

ADMIN_EMAIL = "boss@gmail.com"
ADMIN_PASSWORD = "Adm1n!pass"


@pytest.fixture
def configured_admin(monkeypatch):
    monkeypatch.setattr("event.api.admin_login.ADMIN_EMAIL", ADMIN_EMAIL)
    monkeypatch.setattr("event.api.admin_login.ADMIN_PASSWORD", ADMIN_PASSWORD)


def test_login_disabled_when_password_unset(api, monkeypatch):
    monkeypatch.setattr("event.api.admin_login.ADMIN_PASSWORD", None)
    response = api.post(
        "/api/admin/login/",
        {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        format="json",
    )
    assert response.status_code == 503


def test_missing_credentials_is_400(api, configured_admin):
    assert api.post("/api/admin/login/", {}, format="json").status_code == 400


def test_wrong_credentials_is_401(api, configured_admin):
    response = api.post(
        "/api/admin/login/",
        {"email": ADMIN_EMAIL, "password": "not-it"},
        format="json",
    )
    assert response.status_code == 401


def test_valid_credentials_return_jwt_pair(api, configured_admin):
    response = api.post(
        "/api/admin/login/",
        {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        format="json",
    )
    assert response.status_code == 200
    assert response.data["access"]
    assert response.data["refresh"]
    assert response.data["user"]["is_admin"] is True
