"""Backend API tests for QA Demo Store (FastAPI mirror of PHP backend)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to frontend/.env (test runs outside frontend dir)
    from pathlib import Path
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


# ---------- products ----------
class TestProducts:
    def test_list_products(self, client):
        r = client.get(f"{API}/products.php", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "products" in data
        assert len(data["products"]) == 6
        p = data["products"][0]
        for f in ("id", "name", "description", "price", "image_url", "category", "stock"):
            assert f in p, f"missing field {f}"

    def test_get_product_by_id(self, client):
        r = client.get(f"{API}/products.php", params={"id": 1}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "product" in data
        assert data["product"]["id"] == 1

    def test_get_product_not_found(self, client):
        r = client.get(f"{API}/products.php", params={"id": 999}, timeout=15)
        assert r.status_code == 404
        assert "detail" in r.json()


# ---------- users ----------
class TestUsers:
    def test_list_users_no_password(self, client):
        r = client.get(f"{API}/users.php", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "users" in data
        assert len(data["users"]) == 3
        for u in data["users"]:
            assert "password" not in u


# ---------- login ----------
class TestLogin:
    def test_standard_user_success(self, client):
        r = client.post(f"{API}/login.php",
                        json={"username": "standard_user", "password": "secret_sauce"}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d.get("success") is True
        assert "user" in d
        assert d["user"]["username"] == "standard_user"
        assert "password" not in d["user"]

    def test_locked_out_user(self, client):
        r = client.post(f"{API}/login.php",
                        json={"username": "locked_out_user", "password": "secret_sauce"}, timeout=15)
        assert r.status_code == 403
        assert "locked" in r.json().get("detail", "").lower()

    def test_wrong_password(self, client):
        r = client.post(f"{API}/login.php",
                        json={"username": "standard_user", "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_missing_body(self, client):
        r = client.post(f"{API}/login.php", json={}, timeout=15)
        assert r.status_code in (400, 422)


# ---------- orders ----------
class TestOrders:
    def test_create_order_and_increment(self, client):
        payload = {
            "user_id": 1, "first_name": "QA", "last_name": "Test",
            "address": "1 St", "city": "City", "zipcode": "10001",
            "items": [{"product_id": 1, "name": "Sauce Labs Backpack", "price": 29.99, "quantity": 2}],
            "total": 59.98,
        }
        r1 = client.post(f"{API}/orders.php", json=payload, timeout=15)
        assert r1.status_code == 200
        d1 = r1.json()
        assert d1.get("success") is True
        assert "order_id" in d1
        assert d1["total"] == 59.98
        first_id = d1["order_id"]

        r2 = client.post(f"{API}/orders.php", json=payload, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["order_id"] == first_id + 1

    def test_empty_items(self, client):
        payload = {
            "user_id": 1, "first_name": "QA", "last_name": "Test",
            "address": "1 St", "city": "City", "zipcode": "10001",
            "items": [], "total": 0,
        }
        r = client.post(f"{API}/orders.php", json=payload, timeout=15)
        assert r.status_code == 400
