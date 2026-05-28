# QA Demo Store – Hostinger Deployment Guide (v2)

> v2 adds: bcrypt passwords, Bearer-token authentication, `/api/auth/login.php`,
> protected `/api/users.php` (CRUD) and `/api/orders.php`, server-side total
> recomputation, and a User Management page in the React UI.

This guide deploys a React static frontend + PHP/MySQL backend to **Hostinger shared hosting**.

Final layout on the server:

```
public_html/
├── index.html                ← React build entry
├── static/                   ← React JS/CSS/assets
├── asset-manifest.json
├── favicon.ico
├── .htaccess                 ← React Router + caching
└── api/
    ├── db.php                ← DB connection, JSON helpers, Bearer-token auth
    ├── users.php             ← GET (list) + POST (create) — Bearer required
    ├── products.php          ← GET (list) + GET ?id=N — public
    ├── orders.php            ← GET / GET?user_id / POST — Bearer required
    └── auth/
        └── login.php         ← POST username+password → bearer token
```

---

## 1. Create the MySQL database (Hostinger hPanel)

1. **hPanel → Databases → MySQL Databases** → **Create new database**.
2. Note `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`.
3. Open **phpMyAdmin**.

**Fresh install:**
- In the **SQL** tab, run `sql/schema.sql` (creates `users`, `products`, `orders`, `order_items`, `auth_tokens`).
- Then run `sql/seed.sql` (3 users + 6 products, bcrypt-hashed `secret_sauce`).

**Upgrading from v1:**
- Run `sql/migration_v2.sql` instead — it adds `email`, `password_hash`, `created_at` to `users`, drops the old plaintext `password` column, backfills `secret_sauce` for the demo users, and creates the `auth_tokens` table. Existing products/orders are preserved.

After either path, verify:
```sql
SELECT COUNT(*) FROM users;           -- 3
SELECT COUNT(*) FROM products;        -- 6
SELECT COUNT(*) FROM auth_tokens;     -- 0
SHOW TABLES;                          -- 5 tables
```

---

## 2. Build the React frontend

```bash
cd /app/frontend
REACT_APP_API_BASE="/api" yarn build
```

This produces a `build/` folder. The `REACT_APP_API_BASE=/api` env tells the
React app to call `/api/auth/login.php`, `/api/products.php`, … on the SAME
domain — no CORS needed.

---

## 3. Edit `api/db.php`

Open `hostinger-deploy/api/db.php` and verify the four `define(...)` lines at the
top match your Hostinger DB:

```php
define('DB_HOST', 'srv831.hstgr.io');
define('DB_NAME', 'u797308362_company');
define('DB_USER', 'u797308362_chirag_khimani');
define('DB_PASS', 'SpecialTrust@123');
```

Token TTL is 24h (`TOKEN_TTL_SECONDS`); adjust if needed.

---

## 4. Upload to Hostinger

Final tree on the server:

```
public_html/
├── (everything inside frontend/build/)
├── .htaccess                     ← from hostinger-deploy/.htaccess
└── api/
    ├── db.php
    ├── users.php
    ├── products.php
    ├── orders.php
    └── auth/
        └── login.php
```

Make sure the `api/auth/` subfolder exists on the server.

---

## 5. Smoke-test

```bash
# Public
curl -i https://<your-domain>/api/products.php

# Login → token
TOKEN=$(curl -s -X POST https://<your-domain>/api/auth/login.php \
     -H "Content-Type: application/json" \
     -d '{"username":"standard_user","password":"secret_sauce"}' \
   | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# Protected
curl -i -H "Authorization: Bearer $TOKEN" https://<your-domain>/api/users.php
curl -i -H "Authorization: Bearer $TOKEN" "https://<your-domain>/api/orders.php?user_id=1"

# Missing token
curl -i https://<your-domain>/api/users.php       # → 401
```

---

## 6. API contract (v2)

All responses are JSON. All errors use `{"error": "...", "detail": "..."}`.

### Public

**`GET /api/products.php`** → `{"products":[{id,name,description,price,image_url,category,stock}, ...]}`
**`GET /api/products.php?id=1`** → `{"product":{...}}` or 404

**`POST /api/auth/login.php`**
```json
{"username":"standard_user","password":"secret_sauce"}
```
Response `200`:
```json
{
  "token":"<64-hex-chars>",
  "expires_at":"2026-02-29 06:58:15",
  "user":{"id":1,"username":"standard_user","email":"standard@demo.test","first_name":"Standard","last_name":"User","locked":false,"created_at":"..."}
}
```
Errors: `400` missing fields, `401` bad credentials, `403` locked.

### Protected (`Authorization: Bearer <token>`)

**`GET /api/users.php`** → `{"users":[{id,username,email,first_name,last_name,locked,created_at}, ...]}`

**`POST /api/users.php`**
```json
{"username":"alice","email":"a@x.com","password":"hunter2","first_name":"Alice","last_name":"Smith"}
```
Response `201`: `{"user":{...}}`

**`GET /api/orders.php`** → `{"orders":[{id,user_id,first_name,last_name,address,city,zipcode,total,created_at,items:[{product_id,name,price,quantity}]}, ...]}`
**`GET /api/orders.php?user_id=1`** → same shape, filtered to that user.

**`POST /api/orders.php`**
```json
{
  "first_name":"John","last_name":"Doe","address":"123 Main","city":"SF","zipcode":"94103",
  "items":[{"product_id":1,"quantity":2},{"product_id":2,"quantity":1}]
}
```
Server recomputes total from DB prices; client-supplied prices are ignored.
Response `201`: `{"success":true,"order_id":1,"total":69.97}`

---

## 7. Demo credentials (seeded)

| Username          | Email                | Password       | Behavior              |
|-------------------|----------------------|----------------|-----------------------|
| `standard_user`   | standard@demo.test   | `secret_sauce` | Happy path            |
| `locked_out_user` | locked@demo.test     | `secret_sauce` | 403 on login          |
| `problem_user`    | problem@demo.test    | `secret_sauce` | Happy path            |

Add more via the **User Management** page (`/users`) in the React app, or via:
```bash
curl -X POST https://<your-domain>/api/users.php \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"username":"alice","email":"a@x.com","password":"hunter2"}'
```

---

## 8. Stable selectors (Selenium / Playwright)

| Element                          | Selector                                    |
|----------------------------------|---------------------------------------------|
| Username input                   | `[data-testid="login-username"]`            |
| Password input                   | `[data-testid="login-password"]`            |
| Login button                     | `[data-testid="login-button"]`              |
| Login error                      | `[data-testid="login-error"]`               |
| Product card                     | `[data-testid="product-card-{id}"]`         |
| Add to cart                      | `[data-testid="add-to-cart-{id}"]`          |
| Cart link                        | `[data-testid="cart-link"]`                 |
| Cart badge                       | `[data-testid="cart-badge"]`                |
| Cart total                       | `[data-testid="cart-total"]`                |
| Checkout button                  | `[data-testid="checkout-button"]`           |
| Place order                      | `[data-testid="place-order-button"]`        |
| **Order success message**        | `[data-testid="order-success-message"]`     |
| **User Management link**         | `[data-testid="users-link"]`                |
| **Create user — username**       | `[data-testid="create-user-username"]`      |
| **Create user — password**       | `[data-testid="create-user-password"]`      |
| **Create user — email**          | `[data-testid="create-user-email"]`         |
| **Create user — submit**         | `[data-testid="create-user-button"]`        |
| **User list**                    | `[data-testid="user-list"]`                 |
| **User order history (per id)**  | `[data-testid="user-order-history-{id}"]`   |
| Logout                           | `[data-testid="logout-button"]`             |

---

## 9. Security checklist (v2)

- [x] DB credentials only in `api/db.php`.
- [x] All SQL uses prepared statements (PDO).
- [x] Passwords stored as bcrypt via `password_hash()` / `password_verify()`.
- [x] Bearer tokens are 64-hex (`bin2hex(random_bytes(32))`), stored in `auth_tokens` with a 24h expiry, indexed UNIQUE.
- [x] Expired tokens are deleted on use.
- [x] Order total is recomputed server-side from DB prices — client total is never trusted.
- [x] Proper HTTP statuses: 200, 201, 400, 401, 403, 404, 500.
- [ ] **Recommended for production:** rotate the demo DB password from hPanel and reduce CORS to your exact domain in `db.php`.

---

## 10. Files in this bundle

```
hostinger-deploy/
├── api/
│   ├── db.php
│   ├── users.php
│   ├── products.php
│   ├── orders.php
│   └── auth/
│       └── login.php
├── sql/
│   ├── schema.sql        ← fresh install
│   ├── seed.sql          ← demo users + products
│   └── migration_v2.sql  ← v1 → v2 upgrade
├── .htaccess
├── DEPLOYMENT.md         ← this file
└── README.md
```
