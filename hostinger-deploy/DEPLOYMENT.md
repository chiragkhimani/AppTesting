# QA Demo Store – Hostinger Deployment Guide (v3)

> **v3 changes**: new public `POST /api/signup.php`; User Management UI removed
> (the `POST /api/users.php` admin endpoint is gone — public sign up replaces
> it); checkout simplified to `full_name + address + city + state + pincode +
> phone` (no card fields); orders table reshaped accordingly.

Final layout on the server:

```
public_html/
├── index.html                ← React build entry
├── static/                   ← React JS/CSS/assets
├── .htaccess                 ← React Router + caching
└── api/
    ├── db.php                ← DB connection + helpers + Bearer auth
    ├── products.php          ← GET / GET?id — public
    ├── signup.php            ← POST — public, creates a user
    ├── profile.php           ← GET — Bearer required
    ├── orders.php            ← GET / GET?user_id / POST — Bearer required
    └── auth/
        └── login.php         ← POST — returns Bearer token
```

---

## 1. MySQL database

`hPanel → Databases → MySQL` → create a database; note `DB_HOST / DB_NAME / DB_USER / DB_PASS`.

In **phpMyAdmin**:

* **Fresh install:** run `sql/schema.sql`, then `sql/seed.sql`.
* **Upgrading from v2:** run `sql/migration_v3.sql`. It reshapes the `orders` table (drops `first_name/last_name/zipcode`, adds `full_name/state/pincode/phone`), preserving existing rows.

Verify:
```sql
SELECT COUNT(*) FROM users;       -- 3 (seeded) + any signups
SELECT COUNT(*) FROM products;    -- 6
SHOW COLUMNS FROM orders;         -- full_name, state, pincode, phone present
```

---

## 2. Build the React frontend

```bash
cd /app/frontend
REACT_APP_API_BASE="/api" yarn build
```

`REACT_APP_API_BASE=/api` makes the React build call `/api/auth/login.php`,
`/api/signup.php`, `/api/products.php`, `/api/orders.php`, … on the SAME
domain — no CORS needed.

---

## 3. Confirm `api/db.php` credentials

Open `hostinger-deploy/api/db.php`. Top of the file:

```php
define('DB_HOST', 'srv831.hstgr.io');
define('DB_NAME', 'u922767486_store');
define('DB_USER', 'u922767486_chirag_khimani');
define('DB_PASS', 'SpecialTrust@123');
```

Token TTL is 24h (`TOKEN_TTL_SECONDS`).

---

## 4. Upload

Upload `frontend/build/*` to `public_html/`, plus `.htaccess`, plus the entire
`api/` directory. Make sure `public_html/api/auth/login.php` exists.

---

## 5. Smoke-test

```bash
# Public
curl -i https://<your-domain>/api/products.php

# Sign up
curl -i -X POST https://<your-domain>/api/signup.php \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"hunter2"}'

# Login → token
TOKEN=$(curl -s -X POST https://<your-domain>/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"hunter2"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# Place order
curl -i -X POST https://<your-domain>/api/orders.php \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name":"Alice Smith","address":"123 Main","city":"Mumbai",
    "state":"MH","pincode":"400001","phone":"+91 9876543210",
    "items":[{"product_id":1,"quantity":1}]
  }'

# My orders
curl -i -H "Authorization: Bearer $TOKEN" https://<your-domain>/api/orders.php
```

---

## 6. API contract (v3)

All responses are JSON; errors use `{"error":"…","detail":"…"}`.

### Public

| Endpoint                              | Description                                              |
|---------------------------------------|----------------------------------------------------------|
| `GET  /api/products.php`              | List all products                                         |
| `GET  /api/products.php?id=N`         | Single product, 404 if missing                            |
| `POST /api/auth/login.php`            | `{username,password}` → `{token,expires_at,user}`         |
| `POST /api/signup.php`                | `{username,email,password}` → 201 `{success,message,user}`|

### Protected (`Authorization: Bearer <token>`)

| Endpoint                              | Description                                              |
|---------------------------------------|----------------------------------------------------------|
| `GET  /api/profile.php`               | Current authenticated user                                |
| `GET  /api/orders.php`                | Current user's orders                                     |
| `GET  /api/orders.php?user_id=N`      | Orders for a specific user                                |
| `POST /api/orders.php`                | Create order — server recomputes total                    |

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

## 7. Demo credentials (seeded)

| Username          | Email                | Password       | Behavior         |
|-------------------|----------------------|----------------|------------------|
| `standard_user`   | standard@demo.test   | `secret_sauce` | Happy path       |
| `locked_out_user` | locked@demo.test     | `secret_sauce` | 403 on login     |
| `problem_user`    | problem@demo.test    | `secret_sauce` | Happy path       |

Sign up flow creates additional users via `POST /api/signup.php`.

---

## 8. Stable selectors (Selenium / Playwright)

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

### Checkout
| Element            | Selector                              |
|--------------------|---------------------------------------|
| Full name          | `[data-testid="checkout-name"]`       |
| Address            | `[data-testid="checkout-address"]`    |
| City               | `[data-testid="checkout-city"]`       |
| State              | `[data-testid="checkout-state"]`      |
| Pincode            | `[data-testid="checkout-pincode"]`    |
| Phone              | `[data-testid="checkout-phone"]`      |
| Place order        | `[data-testid="checkout-button"]`     |

### Orders / Confirmation
| Element            | Selector                                   |
|--------------------|--------------------------------------------|
| Orders link        | `[data-testid="orders-link"]`              |
| Orders list        | `[data-testid="orders-list"]`              |
| Order row          | `[data-testid="orders-item-{id}"]`         |
| Order success page | `[data-testid="order-success-message"]`    |
| Logout             | `[data-testid="logout-button"]`            |

---

## 9. Security checklist

- [x] DB credentials only in `api/db.php`.
- [x] Prepared statements (PDO) everywhere.
- [x] Passwords bcrypt-hashed (`password_hash` / `password_verify`).
- [x] Bearer tokens 64-hex via `random_bytes`, stored in `auth_tokens` with 24h expiry; expired tokens deleted on use.
- [x] Order total recomputed server-side from DB prices (client prices ignored).
- [x] Signup validates email format, username pattern, and password length.
- [x] HTTP statuses: 200, 201, 400, 401, 403, 404, 500.

---

## 10. File listing

```
hostinger-deploy/
├── api/
│   ├── db.php
│   ├── products.php
│   ├── signup.php           ← NEW (public)
│   ├── profile.php          ← NEW (Bearer)
│   ├── orders.php           ← updated for v3 fields
│   └── auth/
│       └── login.php
├── sql/
│   ├── schema.sql           ← v3 (fresh install)
│   ├── seed.sql             ← demo users + products
│   ├── migration_v2.sql     ← v1 → v2 (legacy)
│   └── migration_v3.sql     ← v2 → v3
├── .htaccess
├── DEPLOYMENT.md            ← this file
└── README.md
```
