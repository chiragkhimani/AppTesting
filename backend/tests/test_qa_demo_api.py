"""Backend API tests for QA Demo Store v2 (FastAPI mirror).

Covers:
- Public products
- New auth flow: POST /api/auth/login.php (bearer token)
- Protected endpoints: GET/POST /api/users.php, GET/POST /api/orders.php
- Server-side total recomputation (client-supplied price ignored)
"""
import os
import time
import pytest
import requests
from pathlib import Path

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    env_path = Path("/app/frontend/.env")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def token(client):
    r = client.post(f"{API}/auth/login.php",
                    json={"username": "standard_user", "password": "secret_sauce"},
                    timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------- Public products ----------
class TestProducts:
    def test_list_products_public_no_auth(self, client):
        r = client.get(f"{API}/products.php", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "products" in data
        assert len(data["products"]) == 6

    def test_get_product_by_id(self, client):
        r = client.get(f"{API}/products.php", params={"id": 1}, timeout=15)
        assert r.status_code == 200
        assert r.json()["product"]["id"] == 1


# ---------- Auth ----------
class TestAuth:
    def test_login_success_returns_token(self, client):
        r = client.post(f"{API}/auth/login.php",
                        json={"username": "standard_user", "password": "secret_sauce"},
                        timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "token" in d and isinstance(d["token"], str) and len(d["token"]) > 0
        assert "expires_at" in d
        u = d["user"]
        for f in ("id", "username", "email", "first_name", "last_name", "locked", "created_at"):
            assert f in u, f"missing {f}"
        assert "password_hash" not in u
        assert "password" not in u
        assert u["username"] == "standard_user"

    def test_login_locked_user_returns_403(self, client):
        r = client.post(f"{API}/auth/login.php",
                        json={"username": "locked_out_user", "password": "secret_sauce"},
                        timeout=15)
        assert r.status_code == 403

    def test_login_wrong_password_returns_401(self, client):
        r = client.post(f"{API}/auth/login.php",
                        json={"username": "standard_user", "password": "WRONG"},
                        timeout=15)
        assert r.status_code == 401


# ---------- Protected routes need bearer token ----------
class TestAuthGuards:
    def test_users_without_token_401(self, client):
        r = client.get(f"{API}/users.php", timeout=15)
        assert r.status_code == 401

    def test_orders_get_without_token_401(self, client):
        r = client.get(f"{API}/orders.php", timeout=15)
        assert r.status_code == 401

    def test_orders_post_without_token_401(self, client):
        r = client.post(f"{API}/orders.php", json={"items": []}, timeout=15)
        assert r.status_code == 401


# ---------- Users (protected) ----------
class TestUsers:
    def test_list_users_no_password_field(self, client, auth_headers):
        r = client.get(f"{API}/users.php", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        users = r.json()["users"]
        assert len(users) >= 3
        for u in users:
            assert "password" not in u
            assert "password_hash" not in u

    def test_create_user_success(self, client, auth_headers):
        uname = f"TEST_user_{int(time.time())}"
        r = client.post(f"{API}/users.php", headers=auth_headers,
                        json={"username": uname, "email": f"{uname}@demo.test",
                              "password": "secret_sauce", "first_name": "Test"},
                        timeout=15)
        assert r.status_code == 201
        u = r.json()["user"]
        assert u["username"] == uname
        assert "password_hash" not in u

        # verify it appears in list
        r2 = client.get(f"{API}/users.php", headers=auth_headers, timeout=15)
        names = [x["username"] for x in r2.json()["users"]]
        assert uname in names

        # verify created user can log in
        r3 = client.post(f"{API}/auth/login.php",
                         json={"username": uname, "password": "secret_sauce"},
                         timeout=15)
        assert r3.status_code == 200

    def test_create_user_duplicate_username(self, client, auth_headers):
        uname = f"TEST_dup_{int(time.time())}"
        body = {"username": uname, "email": f"{uname}@demo.test", "password": "secret_sauce"}
        r1 = client.post(f"{API}/users.php", headers=auth_headers, json=body, timeout=15)
        assert r1.status_code == 201
        r2 = client.post(f"{API}/users.php", headers=auth_headers,
                         json={"username": uname, "email": f"other_{uname}@demo.test", "password": "secret_sauce"},
                         timeout=15)
        assert r2.status_code == 400

    def test_create_user_invalid_email(self, client, auth_headers):
        r = client.post(f"{API}/users.php", headers=auth_headers,
                        json={"username": f"TEST_bademail_{int(time.time())}",
                              "email": "not-an-email", "password": "secret_sauce"},
                        timeout=15)
        assert r.status_code in (400, 422)

    def test_create_user_short_password(self, client, auth_headers):
        r = client.post(f"{API}/users.php", headers=auth_headers,
                        json={"username": f"TEST_shortpw_{int(time.time())}",
                              "email": f"sp{int(time.time())}@demo.test", "password": "ab"},
                        timeout=15)
        assert r.status_code in (400, 422)


# ---------- Orders (protected) ----------
class TestOrders:
    def test_create_order_server_side_total(self, client, auth_headers):
        # Backpack=$29.99 x2 + Bike Light=$9.99 x1 = $69.97. Bogus price MUST be ignored.
        payload = {
            "first_name": "QA", "last_name": "Tester",
            "address": "1 Pipeline Rd", "city": "Testville", "zipcode": "10001",
            "items": [
                {"product_id": 1, "quantity": 2, "price": 0.01},
                {"product_id": 2, "quantity": 1, "price": 999999},
            ],
        }
        r = client.post(f"{API}/orders.php", headers=auth_headers, json=payload, timeout=15)
        assert r.status_code == 201, r.text
        d = r.json()
        assert d["success"] is True
        assert d["total"] == 69.97
        assert isinstance(d["order_id"], int)

    def test_create_order_empty_items_400(self, client, auth_headers):
        r = client.post(f"{API}/orders.php", headers=auth_headers,
                        json={"first_name": "Q", "last_name": "T", "address": "x", "city": "y",
                              "zipcode": "1", "items": []}, timeout=15)
        assert r.status_code == 400

    def test_create_order_unknown_product_400(self, client, auth_headers):
        r = client.post(f"{API}/orders.php", headers=auth_headers,
                        json={"first_name": "Q", "last_name": "T", "address": "x", "city": "y",
                              "zipcode": "1", "items": [{"product_id": 9999, "quantity": 1}]},
                        timeout=15)
        assert r.status_code == 400

    def test_list_orders_filtered_by_user(self, client, auth_headers):
        # Create one order so user 1 has at least one
        client.post(f"{API}/orders.php", headers=auth_headers,
                    json={"first_name": "Q", "last_name": "T", "address": "x", "city": "y",
                          "zipcode": "1", "items": [{"product_id": 3, "quantity": 1}]},
                    timeout=15)

        r = client.get(f"{API}/orders.php", headers=auth_headers,
                       params={"user_id": 1}, timeout=15)
        assert r.status_code == 200
        orders = r.json()["orders"]
        assert isinstance(orders, list) and len(orders) >= 1
        # All orders belong to user 1
        assert all(o["user_id"] == 1 for o in orders)
        # Newest first by id
        ids = [o["id"] for o in orders]
        assert ids == sorted(ids, reverse=True)
        # Items embedded
        assert "items" in orders[0]
