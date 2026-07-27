# QA Demo Store — REST API Documentation (v4)

**Base URL**

| Environment        | Base URL                                              |
|--------------------|-------------------------------------------------------|
| Hostinger (prod)   | `https://chiragkhimani.in/playground/api`             |
| Local dev          | `${REACT_APP_BACKEND_URL}/api` (FastAPI mirror)       |

**Conventions**

| Item              | Value                                                                  |
|-------------------|------------------------------------------------------------------------|
| Content type      | `application/json; charset=utf-8` (request + response)                 |
| Auth scheme       | `Authorization: Bearer <token>` (opaque, 64 hex chars, 24 h TTL)       |
| Date/time         | ISO-8601 (UTC) for FastAPI; `YYYY-MM-DD HH:MM:SS` (UTC) for PHP        |
| Money             | JSON `number`, 2 decimal places                                        |
| Error envelope    | `{ "error": "<message>", "detail": "<message>" }`                      |

**HTTP status codes used**

| Status | Meaning                                                  |
|--------|----------------------------------------------------------|
| 200    | OK — request succeeded                                   |
| 201    | Created — new resource (signup, order)                   |
| 400    | Bad request — validation, duplicates, malformed payload  |
| 401    | Unauthorized — missing / invalid / expired Bearer token  |
| 403    | Forbidden — account locked                               |
| 404    | Not found — product id, route                            |
| 405    | Method not allowed                                       |
| 500    | Internal server error — DB failure or unexpected         |

---

## 1. Public endpoints

### 1.1 `POST /api/signup`

Create a new user account.

| Field        | Value                                    |
|--------------|------------------------------------------|
| Auth         | **None** (public)                        |
| Method       | `POST`                                   |
| Request body | JSON                                     |
| Success code | `201 Created`                            |

**Request body**

| Field      | Type   | Rules                                                                 |
|------------|--------|-----------------------------------------------------------------------|
| `username` | string | 3–60 chars, regex `^[A-Za-z0-9_.-]+$`                                 |
| `email`    | string | must match `^[^@\s]+@[^@\s]+\.[^@\s]+$` (PHP also runs `FILTER_VALIDATE_EMAIL`) |
| `password` | string | minimum 6 characters                                                  |

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "hunter22"
}
```

**Success response — `201`**

```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": 4,
    "username": "alice",
    "email": "alice@example.com",
    "first_name": "alice",
    "last_name": "",
    "locked": false,
    "created_at": "2026-02-28T07:30:11+00:00"
  }
}
```

**Error responses**

| Status | When                                                                    |
|--------|-------------------------------------------------------------------------|
| 400    | missing field, invalid email, password < 6 chars, invalid username chars |
| 400    | `username` or `email` already exists (`"Username or email is already taken"`) |
| 405    | non-POST method                                                         |

**curl**
```bash
curl -X POST https://<host>/api/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"hunter22"}'
```

---

### 1.2 `POST /api/auth/login`

Exchange username + password for a Bearer token.

| Field        | Value                                    |
|--------------|------------------------------------------|
| Auth         | **None** (public)                        |
| Method       | `POST`                                   |
| Request body | JSON                                     |
| Success code | `200 OK`                                 |

**Request body**

| Field      | Type   | Notes                       |
|------------|--------|-----------------------------|
| `username` | string | required                    |
| `password` | string | required, bcrypt-verified   |

```json
{ "username": "standard_user", "password": "secret_sauce" }
```

**Success response — `200`**

```json
{
  "token": "8b3f…<64 hex chars>",
  "expires_at": "2026-03-01 06:58:15",
  "user": {
    "id": 1,
    "username": "standard_user",
    "email": "standard@demo.test",
    "first_name": "Standard",
    "last_name": "User",
    "locked": false,
    "created_at": "2026-02-28T06:30:00+00:00"
  }
}
```

> Token is opaque (64 hex chars), stored server-side in `auth_tokens` with a 24-hour expiry, and revoked on first access after it has expired.

**Error responses**

| Status | When                                                                 |
|--------|----------------------------------------------------------------------|
| 400    | missing `username` or `password`                                     |
| 401    | wrong credentials — `"Username and password do not match any user…"` |
| 403    | account is locked — `"Sorry, this user has been locked out."`        |
| 405    | non-POST method                                                      |

**curl**
```bash
curl -X POST https://<host>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"standard_user","password":"secret_sauce"}'
```

---

### 1.2b `POST /api/auth/forgot-password`

Demo password reset: set a new password using username + new password + confirm.

| Field        | Value                                    |
|--------------|------------------------------------------|
| Auth         | **None** (public)                        |
| Method       | `POST`                                   |
| Request body | JSON                                     |
| Success code | `200 OK`                                 |
| Side effects | Updates `password_hash`; deletes all `auth_tokens` for that user |

**Request body**

| Field              | Type   | Rules                                      |
|--------------------|--------|--------------------------------------------|
| `username`         | string | required                                   |
| `password`         | string | min 6 characters                           |
| `confirm_password` | string | must equal `password`                      |

```json
{
  "username": "standard_user",
  "password": "new_secret",
  "confirm_password": "new_secret"
}
```

**Success response — `200`**

```json
{
  "success": true,
  "message": "Password updated successfully. You can now log in with your new password."
}
```

**Error responses**

| Status | When                                              |
|--------|---------------------------------------------------|
| 400    | missing fields, password < 6, mismatch             |
| 403    | account locked                                    |
| 404    | username not found                                |

**curl**
```bash
curl -X POST https://<host>/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"username":"standard_user","password":"new_secret","confirm_password":"new_secret"}'
```

---

### 1.3 `GET /api/products`

List all products (catalog).

| Field        | Value         |
|--------------|---------------|
| Auth         | **None**      |
| Method       | `GET`         |
| Success code | `200 OK`      |

**Query parameters** — none.

**Success response — `200`**

```json
{
  "products": [
    {
      "id": 1,
      "name": "Urban Commute Backpack",
      "description": "A slim 20L everyday backpack with a padded 15-inch laptop sleeve…",
      "price": 49.99,
      "image_url": "https://images.unsplash.com/photo-…",
      "category": "Bags",
      "stock": 40
    },
    …
  ]
}
```

Returns **12** catalog products.

**curl**
```bash
curl https://<host>/api/products
```

---

### 1.4 `GET /api/products?id={id}`

Retrieve a single product.

| Field        | Value                       |
|--------------|-----------------------------|
| Auth         | **None**                    |
| Method       | `GET`                       |
| Success code | `200 OK`                    |

**Query parameter**

| Name | Type    | Required | Notes                  |
|------|---------|----------|------------------------|
| `id` | integer | yes      | product primary key    |

**Success response — `200`**

```json
{
  "product": {
    "id": 1,
      "name": "Urban Commute Backpack",
      "description": "A slim 20L everyday backpack with a padded 15-inch laptop sleeve…",
      "price": 49.99,
    "image_url": "…",
    "category": "Bags",
    "stock": 40
  }
}
```

**Error responses**

| Status | When                                  |
|--------|---------------------------------------|
| 400    | non-numeric `id` (PHP returns 400)    |
| 404    | product not found                     |

**curl**
```bash
curl https://<host>/api/products?id=1
```

---

## 2. Protected endpoints

> All endpoints in this section require the header:
> ```
> Authorization: Bearer <token>
> ```
> Obtain a token from `POST /api/auth/login`. Missing / invalid / expired token always returns `401`.

### 2.1 `GET /api/profile`

Return the currently-authenticated user.

| Field        | Value                       |
|--------------|-----------------------------|
| Auth         | **Bearer**                  |
| Method       | `GET`                       |
| Success code | `200 OK`                    |

**Success response — `200`**

```json
{
  "user": {
    "id": 1,
    "username": "standard_user",
    "email": "standard@demo.test",
    "first_name": "Standard",
    "last_name": "User",
    "locked": false,
    "created_at": "2026-02-28T06:30:00+00:00"
  }
}
```

**Error responses**

| Status | When                                  |
|--------|---------------------------------------|
| 401    | missing / invalid / expired token     |
| 403    | user is locked                        |

**curl**
```bash
curl -H "Authorization: Bearer $TOKEN" https://<host>/api/profile
```

---

### 2.2 `GET /api/orders`

List orders belonging to **the authenticated user**, newest first.

| Field        | Value                       |
|--------------|-----------------------------|
| Auth         | **Bearer**                  |
| Method       | `GET`                       |
| Success code | `200 OK`                    |

**Success response — `200`**

```json
{
  "orders": [
    {
      "id": 12,
      "user_id": 1,
      "full_name": "Alice Smith",
      "address": "123 Main",
      "city": "Mumbai",
      "state": "MH",
      "pincode": "400001",
      "phone": "+91 9876543210",
      "subtotal": 61.97,
      "shipping": 5.99,
      "tax": 4.96,
      "total": 72.92,
      "status": "pending",
      "created_at": "2026-02-28T07:42:11+00:00",
      "items": [
        { "product_id": 1, "name": "Urban Commute Backpack", "price": 49.99, "quantity": 1 },
        { "product_id": 3, "name": "Soft Cotton Crew Tee",   "price": 22.99, "quantity": 2 }
      ]
    }
  ]
}
```

Pricing rules (server-side): tax = 8% of subtotal; shipping = `$5.99` or free when subtotal ≥ `$100`; `total` = subtotal + shipping + tax.

If the user has no orders, returns `{"orders":[]}`.

**Error responses**

| Status | When                                  |
|--------|---------------------------------------|
| 401    | missing / invalid / expired token     |

**curl**
```bash
curl -H "Authorization: Bearer $TOKEN" https://<host>/api/orders
```

---

### 2.3 `GET /api/orders?user_id={id}`

List orders for a specific user (admin / cross-user view).

| Field        | Value                       |
|--------------|-----------------------------|
| Auth         | **Bearer**                  |
| Method       | `GET`                       |
| Success code | `200 OK`                    |

**Query parameter**

| Name      | Type    | Required | Notes                                                      |
|-----------|---------|----------|------------------------------------------------------------|
| `user_id` | integer | yes      | if omitted, behaves like §2.2 (returns the caller's orders) |

Same response shape as §2.2.

**curl**
```bash
curl -H "Authorization: Bearer $TOKEN" "https://<host>/api/orders?user_id=1"
```

---

### 2.4 `POST /api/orders`

Create a new order for the authenticated user.

| Field        | Value                                                                            |
|--------------|----------------------------------------------------------------------------------|
| Auth         | **Bearer**                                                                       |
| Method       | `POST`                                                                           |
| Request body | JSON                                                                             |
| Success code | `201 Created`                                                                    |
| Side effects | `total` is **always re-computed server-side from `products.price`** — client-supplied price/total fields are ignored. |

**Request body**

| Field       | Type    | Rules                                                                      |
|-------------|---------|----------------------------------------------------------------------------|
| `full_name` | string  | 2–120 chars                                                                |
| `address`   | string  | 2–255 chars                                                                |
| `city`      | string  | 1–80 chars                                                                 |
| `state`     | string  | 1–80 chars                                                                 |
| `pincode`   | string  | 3–20 chars                                                                 |
| `phone`     | string  | regex `^[+\d][\d\s\-()]{5,19}$` (e.g. `+91 9876543210`)                    |
| `items`     | array   | at least 1; each item: `{ "product_id": int, "quantity": int ≥ 1 }`        |

```json
{
  "full_name": "Alice Smith",
  "address": "123 Main",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "phone": "+91 9876543210",
  "items": [
    { "product_id": 1, "quantity": 1 },
    { "product_id": 3, "quantity": 2 }
  ]
}
```

**Success response — `201`**

```json
{
  "success": true,
  "order_id": 13,
  "subtotal": 61.97,
  "shipping": 5.99,
  "tax": 4.96,
  "total": 72.92
}
```

**Error responses**

| Status | When                                                                       |
|--------|----------------------------------------------------------------------------|
| 400    | any shipping field missing/empty                                           |
| 400    | invalid phone (regex mismatch)                                             |
| 400    | `items` missing or empty                                                   |
| 400    | unknown `product_id` (returns `"Unknown product id N"`)                    |
| 401    | missing / invalid / expired token                                          |
| 500    | DB transaction failure (rolled back, no partial order persisted)           |

**curl**
```bash
curl -X POST https://<host>/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "full_name":"Alice Smith","address":"123 Main","city":"Mumbai",
    "state":"Maharashtra","pincode":"400001","phone":"+91 9876543210",
    "items":[{"product_id":1,"quantity":1},{"product_id":3,"quantity":2}]
  }'
```

---

### 2.5 `POST /api/cancel-order`

Soft-cancel an order owned by the authenticated user (`status` → `cancelled`).

| Field        | Value                       |
|--------------|-----------------------------|
| Auth         | **Bearer**                  |
| Method       | `POST`                      |
| Request body | JSON                        |
| Success code | `200 OK`                    |

**Request body**

| Field      | Type    | Rules                |
|------------|---------|----------------------|
| `order_id` | integer | required, ≥ 1        |

```json
{ "order_id": 12 }
```

**Success response — `200`**

```json
{
  "success": true,
  "message": "Order cancelled",
  "order_id": 12,
  "status": "cancelled"
}
```

**Error responses**

| Status | When                                              |
|--------|---------------------------------------------------|
| 400    | missing/invalid `order_id`, or already cancelled  |
| 401    | missing / invalid / expired token                 |
| 403    | order belongs to another user                     |
| 404    | order not found                                   |

**curl**
```bash
curl -X POST https://<host>/api/cancel-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"order_id":12}'
```

---

## 3. Authentication details

### 3.1 Token issuance

1. Client sends credentials to `POST /api/auth/login`.
2. Backend looks up the user by `username`, verifies `password` against `password_hash` using bcrypt (`password_verify` / `bcrypt.checkpw`).
3. On success, backend generates `token = bin2hex(random_bytes(32))` (PHP) / `secrets.token_hex(32)` (FastAPI), stores it in `auth_tokens(user_id, token, expires_at, created_at)` with `expires_at = NOW() + 24h`, and returns it to the client.
4. Client stores the token in `localStorage` (key `qa_demo_token`).
5. The React axios interceptor automatically sets `Authorization: Bearer <token>` on every subsequent request.

### 3.2 Token validation

For each protected request:

1. Server reads the `Authorization` header (PHP also checks `HTTP_AUTHORIZATION` / `REDIRECT_HTTP_AUTHORIZATION` for CGI/FPM compatibility).
2. Strips the `Bearer ` prefix.
3. Looks up the token in `auth_tokens` joined with `users`.
4. If not found → `401 Invalid token`.
5. If `expires_at < NOW()` → delete the row and return `401 Token expired`.
6. If user is `locked` → `403`.
7. Otherwise the request handler receives the authenticated user object.

### 3.3 Token lifecycle

| Event           | Action                                                       |
|-----------------|--------------------------------------------------------------|
| Login           | Inserts a new row in `auth_tokens`; multiple concurrent tokens per user are allowed. |
| Expiry          | First use after `expires_at` deletes the row and returns 401 |
| Logout          | Client-side only — token is removed from `localStorage`. Server-side row is left to expire naturally (a TTL cleanup is on the P2 backlog). |
| User deletion   | `ON DELETE CASCADE` removes the user's tokens.               |

### 3.4 Public vs protected matrix

| Endpoint                              | Auth      |
|---------------------------------------|-----------|
| `POST /api/signup`                | Public    |
| `POST /api/auth/login`            | Public    |
| `POST /api/auth/forgot-password`  | Public    |
| `GET  /api/products`              | Public    |
| `GET  /api/products?id=N`         | Public    |
| `GET  /api/profile`               | Bearer    |
| `GET  /api/orders`                | Bearer    |
| `GET  /api/orders?user_id=N`      | Bearer    |
| `POST /api/orders`                | Bearer    |
| `POST /api/cancel-order`          | Bearer    |

---

## 4. Data models

### 4.1 `User`
```ts
{
  id:          number;   // auto-increment
  username:    string;   // unique, 3–60 chars, [A-Za-z0-9_.-]
  email:       string;   // unique
  first_name:  string;
  last_name:   string;
  locked:      boolean;
  created_at:  string;   // ISO-8601 / Y-m-d H:i:s
  // password_hash is NEVER returned
}
```

### 4.2 `Product`
```ts
{
  id:           number;
  name:         string;
  description:  string;
  price:        number;   // 2dp
  image_url:    string;
  category:     string;
  stock:        number;
}
```

### 4.3 `OrderItem`
```ts
{
  product_id:  number;
  name:        string;   // snapshot of product name at purchase time
  price:       number;   // snapshot of product price at purchase time (server-derived)
  quantity:    number;
}
```

### 4.4 `Order`
```ts
{
  id:          number;
  user_id:     number | null;
  full_name:   string;
  address:     string;
  city:        string;
  state:       string;
  pincode:     string;
  phone:       string;
  subtotal:    number;        // Σ items[i].price × items[i].quantity
  shipping:    number;        // 5.99 or 0 when subtotal ≥ 100
  tax:         number;        // 8% of subtotal
  total:       number;        // subtotal + shipping + tax
  status:      "pending" | "cancelled";
  created_at:  string;
  items:       OrderItem[];   // present in GET responses
}
```

### 4.5 `AuthToken` (server-side only — never returned in full)
```ts
{
  id:          number;
  user_id:     number;
  token:       string;        // 64 hex chars
  expires_at:  string;        // Y-m-d H:i:s, NOW() + 24h
  created_at:  string;
}
```

---

## 5. Error envelope

Every non-2xx response shares this shape:

```json
{ "error": "<human-readable message>", "detail": "<same message>" }
```

`detail` is kept for clients (the React frontend reads `err.response.data.detail`); `error` is kept for parity with common PHP conventions.

---

## 6. CORS

The PHP backend (in `api/db.php`) sets:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

Preflight `OPTIONS` requests return `204` immediately. For production, tighten `Allow-Origin` to your exact frontend domain.

---

## 7. Test users (seeded)

All seeded passwords: `secret_sauce` (bcrypt-hashed in DB).

| Username          | Email                | Behavior                    |
|-------------------|----------------------|-----------------------------|
| `standard_user`   | standard@demo.test   | Happy path                  |
| `locked_out_user` | locked@demo.test     | Login returns 403           |
| `problem_user`    | problem@demo.test    | Happy path                  |

---

## 8. End-to-end example

```bash
# 1) Sign up (or skip this and use a seeded user)
curl -s -X POST https://<host>/api/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"hunter22"}'

# 2) Log in to get a token
TOKEN=$(curl -s -X POST https://<host>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"hunter22"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# 3) Browse products (public)
curl -s https://<host>/api/products

# 4) Place an order
curl -s -X POST https://<host>/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "full_name":"Alice Smith","address":"123 Main","city":"Mumbai",
    "state":"Maharashtra","pincode":"400001","phone":"+91 9876543210",
    "items":[{"product_id":1,"quantity":1}]
  }'

# 5) See my orders
curl -s -H "Authorization: Bearer $TOKEN" https://<host>/api/orders

# 6) Cancel an order (replace 13 with a real order_id)
curl -s -X POST https://<host>/api/cancel-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"order_id":13}'

# 7) Who am I
curl -s -H "Authorization: Bearer $TOKEN" https://<host>/api/profile
```

---

_Last updated: 2026-07-27 — v4 (forgot-password + cancel-order)._
