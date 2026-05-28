# QA Demo Store – Hostinger Deployment Guide

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
    ├── db.php                ← DB connection + helpers (credentials live here)
    ├── login.php
    ├── users.php
    ├── products.php
    └── orders.php
```

---

## 1. Create the MySQL database (Hostinger hPanel)

1. Go to **hPanel → Databases → MySQL Databases**.
2. Click **Create new database**. Note down:
   - `DB_NAME` (e.g. `u123456_qa`)
   - `DB_USER` (e.g. `u123456_qa`)
   - `DB_PASS` (the password you set)
   - `DB_HOST` is usually `localhost`.
3. Open **phpMyAdmin** for the database you just created.
4. In the **SQL** tab, paste & run the contents of `sql/schema.sql`.
5. Paste & run the contents of `sql/seed.sql` to load demo users and products.

You should now see `users` (3 rows), `products` (6 rows), `orders` and `order_items` (empty).

---

## 2. Build the React frontend

From your machine, inside `/app/frontend`:

```bash
# Tell the build to call the PHP API at /api on the same domain
REACT_APP_API_BASE="/api" yarn build
```

This produces a `build/` folder containing `index.html`, `static/`, etc.

> Notes
> * `REACT_APP_API_BASE=/api` makes the React app send requests to `/api/login.php`,
>   `/api/products.php`, … on the **same** domain that serves the HTML – no CORS needed.
> * For local development inside the Emergent sandbox, `REACT_APP_BACKEND_URL` is
>   used automatically and points to the FastAPI mirror exposing the exact same
>   endpoint paths.

---

## 3. Configure database credentials in `api/db.php`

Open `hostinger-deploy/api/db.php` and edit the four `define(...)` lines at the top
with the values from step 1:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456_qa');
define('DB_USER', 'u123456_qa');
define('DB_PASS', 'your-strong-password');
```

⚠️ These credentials live **only** in this file. They are never sent to the browser.

---

## 4. Upload to Hostinger

You can use **hPanel → File Manager** or any FTP/SFTP client.

Upload everything so the final tree on the server matches:

```
public_html/
├── (everything inside frontend/build/)
├── .htaccess                     ← copy from hostinger-deploy/.htaccess
└── api/
    ├── db.php                    ← the one you edited
    ├── login.php
    ├── users.php
    ├── products.php
    └── orders.php
```

Step-by-step using **File Manager**:

1. Open `public_html/`.
2. Upload all files & folders from your local `frontend/build/` into `public_html/`.
3. Upload `hostinger-deploy/.htaccess` into `public_html/`.
4. Create a folder `public_html/api/`.
5. Upload all five PHP files from `hostinger-deploy/api/` into `public_html/api/`.

---

## 5. Smoke-test

Visit, replacing `<your-domain>`:

| URL                                           | Expected                              |
|-----------------------------------------------|---------------------------------------|
| `https://<your-domain>/api/products.php`      | JSON list of 6 products               |
| `https://<your-domain>/api/users.php`         | JSON list of 3 users (no passwords)   |
| `https://<your-domain>/`                      | Login page                            |
| Login `standard_user / secret_sauce`          | Redirects to product list             |
| Login `locked_out_user / secret_sauce`        | "Sorry, this user has been locked out."|

---

## 6. Demo credentials

| Username          | Password      | Behavior                |
|-------------------|---------------|-------------------------|
| `standard_user`   | `secret_sauce`| Normal happy path       |
| `locked_out_user` | `secret_sauce`| Login is rejected (403) |
| `problem_user`    | `secret_sauce`| Normal happy path       |

---

## 7. API reference (matches PHP and FastAPI mirror)

All responses are JSON.

### `POST /api/login.php`
Request:
```json
{"username":"standard_user","password":"secret_sauce"}
```
Success `200`:
```json
{"success":true,"user":{"id":1,"username":"standard_user","first_name":"Standard","last_name":"User","locked":false}}
```
Failure `401`/`403`:
```json
{"error":"...","detail":"..."}
```

### `GET /api/users.php`
```json
{"users":[{"id":1,"username":"standard_user","first_name":"Standard","last_name":"User","locked":false}, ...]}
```

### `GET /api/products.php`
```json
{"products":[{"id":1,"name":"Sauce Labs Backpack","description":"...","price":29.99,"image_url":"...","category":"Bags","stock":25}, ...]}
```

### `GET /api/products.php?id=1`
```json
{"product":{"id":1,"name":"Sauce Labs Backpack","price":29.99, ...}}
```

### `POST /api/orders.php`
Request:
```json
{
  "user_id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "address": "123 Main St",
  "city": "San Francisco",
  "zipcode": "94103",
  "total": 39.98,
  "items": [
    {"product_id": 1, "name": "Sauce Labs Backpack", "price": 29.99, "quantity": 1},
    {"product_id": 2, "name": "Sauce Labs Bike Light", "price": 9.99, "quantity": 1}
  ]
}
```
Success `200`:
```json
{"success":true,"order_id":1,"total":39.98}
```

---

## 8. Stable selectors for Selenium / Playwright

Every interactive element exposes a `data-testid`. Key ones:

| Element                          | Selector                                    |
|----------------------------------|---------------------------------------------|
| Username input                   | `[data-testid="login-username"]`            |
| Password input                   | `[data-testid="login-password"]`            |
| Login button                     | `[data-testid="login-button"]`              |
| Login error banner               | `[data-testid="login-error"]`               |
| Product card (by id)             | `[data-testid="product-card-1"]`            |
| Add to cart (by id)              | `[data-testid="add-to-cart-1"]`             |
| Remove from cart (by id)         | `[data-testid="remove-from-cart-1"]`        |
| Cart link / icon                 | `[data-testid="cart-link"]`                 |
| Cart badge (count)               | `[data-testid="cart-badge"]`                |
| Cart total                       | `[data-testid="cart-total"]`                |
| Checkout button                  | `[data-testid="checkout-button"]`           |
| Checkout fields                  | `[data-testid="checkout-first-name"]`, …    |
| Place order                      | `[data-testid="place-order-button"]`        |
| Order confirmation               | `[data-testid="order-confirmation"]`        |
| Order number                     | `[data-testid="order-number"]`              |
| Logout                           | `[data-testid="logout-button"]`             |

---

## 9. Security checklist

- [x] DB credentials only in `api/db.php` (not bundled into the JS build).
- [x] All SQL uses **prepared statements** (PDO with named params).
- [x] CORS headers limited to JSON endpoints in `api/db.php`.
- [x] Hashes-equal compare for passwords (`hash_equals`).
- [ ] **For production**, switch to `password_hash()` + `password_verify()` instead of
      storing plaintext passwords (kept plaintext here so seed.sql is human-readable
      for QA practice).

Happy testing! 🧪
