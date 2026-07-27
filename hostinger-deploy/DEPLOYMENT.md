# QA Demo Store – Hostinger Deployment Guide (v4)

> **v4 changes**: public `POST /api/auth/forgot-password` (demo reset by
> username); protected `POST /api/cancel-order`; orders gain a `status`
> column (`pending` | `cancelled`).
>
> **v3 changes**: new public `POST /api/signup.php`; User Management UI removed
> (the `POST /api/users.php` admin endpoint is gone — public sign up replaces
> it); checkout simplified to `full_name + address + city + state + pincode +
> phone` (no card fields); orders table reshaped accordingly.

Final layout on the server:

```
public_html/
└── playground/
    ├── index.html            ← React build entry
    ├── static/               ← React JS/CSS/assets
    ├── swagger/              ← Swagger UI (public API docs)
    │   ├── index.html
    │   └── openapi.yaml
    ├── .htaccess             ← React Router + caching
    └── api/
        ├── db.php                 ← DB connection + helpers + Bearer auth
        ├── products.php           ← GET / GET?id — public
        ├── signup.php             ← POST — public, creates a user
        ├── profile.php            ← GET — Bearer required
        ├── orders.php             ← GET / GET?user_id / POST — Bearer required
        ├── cancel-order.php       ← POST — Bearer required, soft-cancel
        └── auth/
            ├── login.php          ← POST — returns Bearer token
            └── forgot-password.php← POST — public demo password reset
```

Live URLs:
- App: `https://chiragkhimani.in/playground`
- API: `https://chiragkhimani.in/playground/api`
- Swagger: `https://chiragkhimani.in/playground/swagger`

---

## 1. MySQL database

`hPanel → Databases → MySQL` → create a database; note `DB_HOST / DB_NAME / DB_USER / DB_PASS`.

In **phpMyAdmin**:

* **Fresh install:** run `sql/schema.sql`, then `sql/seed.sql`.
* **Upgrading from v2:** run `sql/migration_v3.sql`, then `v4`, then `v5`.
* **Upgrading from v3:** run `sql/migration_v4.sql`, then `sql/migration_v5.sql`.
* **Upgrading from v4:** run `sql/migration_v5.sql` (adds `subtotal` / `shipping` / `tax`).

Verify:
```sql
SELECT COUNT(*) FROM users;       -- 3 (seeded) + any signups
SELECT COUNT(*) FROM products;    -- 12
SHOW COLUMNS FROM orders;         -- subtotal, shipping, tax, status present
```

---

## 2. Build the React frontend

```bash
cd /app/frontend
REACT_APP_API_BASE="/playground/api" yarn build
```

`REACT_APP_API_BASE=/playground/api` makes the React build call `/playground/api/auth/login`,
`/playground/api/signup`, `/playground/api/products`, `/playground/api/orders`, … on the SAME
domain — no CORS needed. The `homepage` field in `package.json` is set to `/playground` so
static assets and client-side routing work under that path.

---

## 3. Confirm `api/db.php` credentials

Open `hostinger-deploy/api/db.php`. Top of the file:

```php
define('DB_HOST', 'srv1111.hstgr.io');
define('DB_NAME', 'u922767486_store');
define('DB_USER', 'u922767486_chirag_khimani');
define('DB_PASS', 'SpecialTrust@123');
```

Token TTL is 24h (`TOKEN_TTL_SECONDS`).

---

## 4. Upload

Upload `frontend/build/*` to `public_html/playground/`, plus `.htaccess`, plus the entire
`api/` directory under `public_html/playground/api/`. Make sure
`public_html/playground/api/auth/login.php` exists.

---

## 5. API documentation (Swagger)

After deploy, interactive API docs are public at:

**https://chiragkhimani.in/playground/swagger/**

Anyone can browse endpoints, authenticate with **Authorize** (paste a Bearer token
from login), and try requests against the live API.

Source files live in `hostinger-deploy/swagger/` and are deployed automatically by
the GitHub Actions workflow.

---

## 6. Smoke-test

```bash
# Public
curl -i https://chiragkhimani.in/playground/api/products.php

# Sign up
curl -i -X POST https://chiragkhimani.in/playground/api/signup.php \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"hunter2"}'

# Login → token
TOKEN=$(curl -s -X POST https://chiragkhimani.in/playground/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"hunter2"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# Place order
curl -i -X POST https://chiragkhimani.in/playground/api/orders.php \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name":"Alice Smith","address":"123 Main","city":"Mumbai",
    "state":"MH","pincode":"400001","phone":"+91 9876543210",
    "items":[{"product_id":1,"quantity":1}]
  }'

# My orders
curl -i -H "Authorization: Bearer $TOKEN" https://chiragkhimani.in/playground/api/orders.php
```

---

## 7. API contract (v4)

All responses are JSON; errors use `{"error":"…","detail":"…"}`.

### Public

| Endpoint                              | Description                                              |
|---------------------------------------|----------------------------------------------------------|
| `GET  /api/products.php`              | List all products                                         |
| `GET  /api/products.php?id=N`         | Single product, 404 if missing                            |
| `POST /api/auth/login.php`            | `{username,password}` → `{token,expires_at,user}`         |
| `POST /api/auth/forgot-password.php`  | `{username,password,confirm_password}` → update password  |
| `POST /api/signup.php`                | `{username,email,password}` → 201 `{success,message,user}`|

### Protected (`Authorization: Bearer <token>`)

| Endpoint                              | Description                                              |
|---------------------------------------|----------------------------------------------------------|
| `GET  /api/profile.php`               | Current authenticated user                                |
| `GET  /api/orders.php`                | Current user's orders                                     |
| `GET  /api/orders.php?user_id=N`      | Orders for a specific user                                |
| `POST /api/orders.php`                | Create order — server recomputes total                    |
| `POST /api/cancel-order.php`          | `{order_id}` → soft-cancel (`status=cancelled`)           |

**POST `/api/orders.php` body**:
```json
{
  "full_name":"Alice Smith",
  "address":"123 Main",
  "city":"Mumbai",
  "state":"Maharashtra",
  "pincode":"400001",
  "phone":"+91 9876543210",
  "items":[{"product_id":1,"quantity":2}]
}
```

---

## 8. Demo credentials (seeded)

| Username          | Email                | Password       | Behavior         |
|-------------------|----------------------|----------------|------------------|
| `standard_user`   | standard@demo.test   | `secret_sauce` | Happy path       |
| `locked_out_user` | locked@demo.test     | `secret_sauce` | 403 on login     |
| `problem_user`    | problem@demo.test    | `secret_sauce` | Happy path       |

Sign up flow creates additional users via `POST /api/signup.php`.

---

## 9. Stable selectors (Selenium / Playwright)

### Login
| Element            | Selector                              |
|--------------------|---------------------------------------|
| Username input     | `[data-testid="login-username"]`      |
| Password input     | `[data-testid="login-password"]`      |
| Login button       | `[data-testid="login-button"]`        |
| Login error        | `[data-testid="login-error"]`         |
| Signup link        | `[data-testid="signup-link"]`         |

### Signup
| Element            | Selector                              |
|--------------------|---------------------------------------|
| Username input     | `[data-testid="signup-username"]`     |
| Email input        | `[data-testid="signup-email"]`        |
| Password input     | `[data-testid="signup-password"]`     |
| Signup button      | `[data-testid="signup-button"]`       |
| Signup error       | `[data-testid="signup-error"]`        |

### Products / Cart
| Element                      | Selector                                  |
|------------------------------|-------------------------------------------|
| Product card                 | `[data-testid="product-card-{id}"]`       |
| Add to cart                  | `[data-testid="add-to-cart-{id}"]`        |
| Cart link                    | `[data-testid="cart-link"]`               |
| Cart badge                   | `[data-testid="cart-badge"]`              |
| Cart total                   | `[data-testid="cart-total"]`              |

### Checkout → Review → Place order
| Element            | Selector                                   |
|--------------------|--------------------------------------------|
| Full name          | `[data-testid="checkout-name"]`            |
| Address            | `[data-testid="checkout-address"]`         |
| City               | `[data-testid="checkout-city"]`            |
| State              | `[data-testid="checkout-state"]`           |
| Pincode            | `[data-testid="checkout-pincode"]`         |
| Phone              | `[data-testid="checkout-phone"]`           |
| Card name          | `[data-testid="checkout-card-name"]`       |
| Card number        | `[data-testid="checkout-card-number"]`     |
| Card expiry        | `[data-testid="checkout-card-exp"]`        |
| Card CVV           | `[data-testid="checkout-card-cvv"]`        |
| Dummy card tip     | `[data-testid="checkout-dummy-card"]`      |
| Continue to review | `[data-testid="checkout-continue"]`        |
| Review page title  | `[data-testid="review-title"]`             |
| Review tax         | `[data-testid="review-tax"]`               |
| Review shipping    | `[data-testid="review-shipping-cost"]`     |
| Place order        | `[data-testid="checkout-button"]` (on review) |

### Orders / Confirmation
| Element            | Selector                                   |
|--------------------|--------------------------------------------|
| Orders link        | `[data-testid="orders-link"]`              |
| Orders list        | `[data-testid="orders-list"]`              |
| Order row          | `[data-testid="orders-item-{id}"]`         |
| Order success page | `[data-testid="order-success-message"]`    |
| Logout             | `[data-testid="logout-button"]`            |

---

## 10. Security checklist

- [x] DB credentials only in `api/db.php`.
- [x] Prepared statements (PDO) everywhere.
- [x] Passwords bcrypt-hashed (`password_hash` / `password_verify`).
- [x] Bearer tokens 64-hex via `random_bytes`, stored in `auth_tokens` with 24h expiry; expired tokens deleted on use.
- [x] Order total recomputed server-side from DB prices (client prices ignored).
- [x] Signup validates email format, username pattern, and password length.
- [x] HTTP statuses: 200, 201, 400, 401, 403, 404, 500.

---

## 11. File listing

```
hostinger-deploy/
├── api/
│   ├── db.php
│   ├── products.php
│   ├── signup.php
│   ├── profile.php
│   ├── orders.php
│   ├── cancel-order.php     ← NEW (v4)
│   └── auth/
│       ├── login.php
│       └── forgot-password.php ← NEW (v4)
├── swagger/
│   ├── index.html           ← Swagger UI
│   └── openapi.yaml         ← OpenAPI 3 spec (v4)
├── sql/
│   ├── schema.sql           ← v4 (fresh install)
│   ├── seed.sql             ← demo users + products
│   ├── migration_v2.sql     ← v1 → v2 (legacy)
│   ├── migration_v3.sql     ← v2 → v3
│   └── migration_v4.sql     ← v3 → v4 (orders.status)
├── .htaccess
├── DEPLOYMENT.md            ← this file
└── README.md
```
