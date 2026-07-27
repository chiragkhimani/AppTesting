"""Backend API tests for QA Demo Store v4 (FastAPI mirror).

Covers:
- Public products
- New public signup flow: POST /api/signup.php (no auth)
- Login flow: POST /api/auth/login.php (bearer token)
- Forgot password: POST /api/auth/forgot-password.php (public)
- Profile: GET /api/profile.php (Bearer)
- Orders: GET/POST /api/orders.php (Bearer, current-user-only)
- Cancel order: POST /api/cancel-order.php (Bearer)
- Server-side total recompute (client-supplied price ignored)
- Removed endpoint: POST /api/users.php must NOT exist anymore
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


# Create a fresh signup-user once per module to verify the full new flow
@pytest.fixture(scope="module")
def new_user(client):
    uname = f"TEST_signup_{int(time.time())}"
    body = {"username": uname, "email": f"{uname}@demo.test", "password": "secret_sauce"}
    r = client.post(f"{API}/signup.php", json=body, timeout=15)
    assert r.status_code == 201, f"signup failed: {r.status_code} {r.text}"
    return {"username": uname, "email": body["email"], "password": body["password"], "resp": r.json()}


@pytest.fixture(scope="module")
def token(client, new_user):
    r = client.post(f"{API}/auth/login.php",
                    json={"username": new_user["username"], "password": new_user["password"]},
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
        assert len(data["products"]) >= 12

    def test_get_product_by_id(self, client):
        r = client.get(f"{API}/products.php", params={"id": 1}, timeout=15)
        assert r.status_code == 200
        assert r.json()["product"]["id"] == 1


# ---------- Signup (public) ----------
class TestSignup:
    def test_signup_success_201(self, client, new_user):
        d = new_user["resp"]
        assert d.get("success") is True
        assert d.get("message") == "Account created successfully"
        u = d["user"]
        assert u["username"] == new_user["username"]
        assert u["email"].lower() == new_user["email"].lower()
        assert "password_hash" not in u
        assert "password" not in u

    def test_signup_duplicate_username_400(self, client, new_user):
        r = client.post(f"{API}/signup.php",
                        json={"username": new_user["username"],
                              "email": f"other_{new_user['email']}",
                              "password": "secret_sauce"}, timeout=15)
        assert r.status_code == 400

    def test_signup_duplicate_email_400(self, client, new_user):
        r = client.post(f"{API}/signup.php",
                        json={"username": f"OTHER_{new_user['username']}",
                              "email": new_user["email"],
                              "password": "secret_sauce"}, timeout=15)
        assert r.status_code == 400

    def test_signup_short_password_4xx(self, client):
        r = client.post(f"{API}/signup.php",
                        json={"username": f"TEST_shortpw_{int(time.time())}",
                              "email": f"sp{int(time.time())}@demo.test",
                              "password": "ab"}, timeout=15)
        assert 400 <= r.status_code < 500

    def test_signup_invalid_email_4xx(self, client):
        r = client.post(f"{API}/signup.php",
                        json={"username": f"TEST_bademail_{int(time.time())}",
                              "email": "not-an-email",
                              "password": "secret_sauce"}, timeout=15)
        assert 400 <= r.status_code < 500


# ---------- Removed legacy endpoint ----------
class TestUsersEndpointRemoved:
    def test_users_post_endpoint_does_not_exist(self, client):
        r = client.post(f"{API}/users.php",
                        json={"username": "x", "email": "x@x.x", "password": "secret_sauce"},
                        timeout=15)
        assert r.status_code in (404, 405), f"expected 404/405, got {r.status_code}: {r.text}"

    def test_users_get_endpoint_does_not_exist(self, client):
        r = client.get(f"{API}/users.php", timeout=15)
        assert r.status_code in (404, 405)


# ---------- Auth ----------
class TestAuth:
    def test_login_success_returns_token(self, client):
        r = client.post(f"{API}/auth/login.php",
                        json={"username": "standard_user", "password": "secret_sauce"},
                        timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d.get("token"), str) and len(d["token"]) > 0
        u = d["user"]
        assert "password_hash" not in u
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

    def test_login_newly_signed_up_user(self, client, new_user):
        r = client.post(f"{API}/auth/login.php",
                        json={"username": new_user["username"], "password": new_user["password"]},
                        timeout=15)
        assert r.status_code == 200
        assert "token" in r.json()


# ---------- Profile (protected) ----------
class TestProfile:
    def test_profile_without_token_401(self, client):
        r = client.get(f"{API}/profile.php", timeout=15)
        assert r.status_code == 401

    def test_profile_with_token_returns_user(self, client, auth_headers, new_user):
        r = client.get(f"{API}/profile.php", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        u = r.json()["user"]
        assert u["username"] == new_user["username"]
        assert "password_hash" not in u


# ---------- Orders protected guards ----------
class TestOrderGuards:
    def test_orders_get_without_token_401(self, client):
        r = client.get(f"{API}/orders.php", timeout=15)
        assert r.status_code == 401

    def test_orders_post_without_token_401(self, client):
        r = client.post(f"{API}/orders.php", json={}, timeout=15)
        assert r.status_code == 401


# ---------- Orders (v3 fields) ----------
def _valid_order_body(items=None):
    return {
        "full_name": "QA Tester",
        "address": "1 Pipeline Rd",
        "city": "Testville",
        "state": "Maharashtra",
        "pincode": "400001",
        "phone": "+91 9876543210",
        "items": items if items is not None else [{"product_id": 1, "quantity": 2}],
    }


class TestOrders:
    def test_create_order_server_side_total(self, client, auth_headers):
        # Backpack=$49.99 x2 + Bike Light=$19.99 x1 = $119.97 subtotal. Bogus price MUST be ignored.
        # Free shipping (≥ $100) + tax 8% ($9.60) => grand total $129.57
        body = _valid_order_body(items=[
            {"product_id": 1, "quantity": 2, "price": 0.01},
            {"product_id": 2, "quantity": 1, "price": 999999},
        ])
        r = client.post(f"{API}/orders.php", headers=auth_headers, json=body, timeout=15)
        assert r.status_code == 201, r.text
        d = r.json()
        assert d["success"] is True
        assert d["subtotal"] == 119.97
        assert d["shipping"] == 0.0
        assert d["tax"] == 9.60
        assert d["total"] == 129.57
        assert isinstance(d["order_id"], int)

    @pytest.mark.parametrize("missing", ["full_name", "address", "city", "state", "pincode", "phone"])
    def test_create_order_missing_field_400(self, client, auth_headers, missing):
        body = _valid_order_body()
        body.pop(missing)
        r = client.post(f"{API}/orders.php", headers=auth_headers, json=body, timeout=15)
        assert 400 <= r.status_code < 500

    def test_create_order_invalid_phone_4xx(self, client, auth_headers):
        body = _valid_order_body()
        body["phone"] = "abc"
        r = client.post(f"{API}/orders.php", headers=auth_headers, json=body, timeout=15)
        assert 400 <= r.status_code < 500

    def test_create_order_empty_items_400(self, client, auth_headers):
        body = _valid_order_body(items=[])
        r = client.post(f"{API}/orders.php", headers=auth_headers, json=body, timeout=15)
        assert r.status_code == 400

    def test_create_order_unknown_product_400(self, client, auth_headers):
        body = _valid_order_body(items=[{"product_id": 9999, "quantity": 1}])
        r = client.post(f"{API}/orders.php", headers=auth_headers, json=body, timeout=15)
        assert r.status_code == 400

    def test_list_orders_returns_only_current_user(self, client, auth_headers, new_user):
        # Place one order for the new (signup) user
        client.post(f"{API}/orders.php", headers=auth_headers,
                    json=_valid_order_body(items=[{"product_id": 3, "quantity": 1}]), timeout=15)

        r = client.get(f"{API}/orders.php", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        orders = r.json()["orders"]
        assert isinstance(orders, list) and len(orders) >= 1

        # Look up the new user's id from profile, then assert all orders belong to them
        prof = client.get(f"{API}/profile.php", headers=auth_headers, timeout=15).json()["user"]
        assert all(o["user_id"] == prof["id"] for o in orders)
        ids = [o["id"] for o in orders]
        assert ids == sorted(ids, reverse=True)
        # v3/v5 fields present
        first = orders[0]
        for k in (
            "full_name", "address", "city", "state", "pincode", "phone",
            "subtotal", "shipping", "tax", "total", "status", "items",
        ):
            assert k in first, f"missing {k} in order row"
        assert first["status"] in ("pending", "cancelled")


class TestForgotPassword:
    def test_forgot_password_updates_and_login_works(self, client):
        uname = f"TEST_fp_{int(time.time())}"
        client.post(
            f"{API}/signup.php",
            json={"username": uname, "email": f"{uname}@demo.test", "password": "oldpass1"},
            timeout=15,
        )
        r = client.post(
            f"{API}/auth/forgot-password.php",
            json={
                "username": uname,
                "password": "newpass1",
                "confirm_password": "newpass1",
            },
            timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success") is True

        old = client.post(
            f"{API}/auth/login.php",
            json={"username": uname, "password": "oldpass1"},
            timeout=15,
        )
        assert old.status_code == 401

        new = client.post(
            f"{API}/auth/login.php",
            json={"username": uname, "password": "newpass1"},
            timeout=15,
        )
        assert new.status_code == 200
        assert "token" in new.json()

    def test_forgot_password_mismatch_400(self, client):
        r = client.post(
            f"{API}/auth/forgot-password.php",
            json={
                "username": "standard_user",
                "password": "abcdef",
                "confirm_password": "ghijkl",
            },
            timeout=15,
        )
        assert r.status_code == 400

    def test_forgot_password_unknown_user_404(self, client):
        r = client.post(
            f"{API}/auth/forgot-password.php",
            json={
                "username": "does_not_exist_xyz",
                "password": "abcdef",
                "confirm_password": "abcdef",
            },
            timeout=15,
        )
        assert r.status_code == 404


class TestCancelOrder:
    def test_cancel_order_success(self, client, auth_headers):
        created = client.post(
            f"{API}/orders.php",
            headers=auth_headers,
            json=_valid_order_body(items=[{"product_id": 1, "quantity": 1}]),
            timeout=15,
        )
        assert created.status_code == 201, created.text
        order_id = created.json()["order_id"]

        r = client.post(
            f"{API}/cancel-order.php",
            headers=auth_headers,
            json={"order_id": order_id},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["success"] is True
        assert body["status"] == "cancelled"
        assert body["order_id"] == order_id

        listed = client.get(f"{API}/orders.php", headers=auth_headers, timeout=15)
        match = next(o for o in listed.json()["orders"] if o["id"] == order_id)
        assert match["status"] == "cancelled"

        again = client.post(
            f"{API}/cancel-order.php",
            headers=auth_headers,
            json={"order_id": order_id},
            timeout=15,
        )
        assert again.status_code == 400

    def test_cancel_order_without_token_401(self, client):
        r = client.post(
            f"{API}/cancel-order.php",
            json={"order_id": 1},
            timeout=15,
        )
        assert r.status_code == 401

    def test_cancel_order_not_found_404(self, client, auth_headers):
        r = client.post(
            f"{API}/cancel-order.php",
            headers=auth_headers,
            json={"order_id": 999999},
            timeout=15,
        )
        assert r.status_code == 404
