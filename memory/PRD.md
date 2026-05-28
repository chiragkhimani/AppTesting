# QA Demo Store – Product Requirements Document

## Problem statement
Build a simple saucedemo.com-style e-commerce demo for QA / Selenium / Playwright
automation practice. Target deployment is **Hostinger shared hosting** with a
**PHP + MySQL** backend and a **React** static frontend.

## Architecture

```
┌──────────────────────────┐         ┌──────────────────────────┐
│  React build (static)    │  HTTPS  │  PHP REST API            │
│  public_html/index.html  │ ──────▶ │  public_html/api/*.php   │
└──────────────────────────┘         └────────────┬─────────────┘
                                                  │
                                                  ▼
                                            MySQL (Hostinger)
```

For local preview inside the Emergent sandbox (PHP not runnable), a
**FastAPI mirror** at `/app/backend/server.py` exposes the EXACT same paths
(`/api/login.php`, `/api/users.php`, `/api/products.php[?id=N]`, `/api/orders.php`)
and the same JSON contract, backed by MongoDB. The React frontend points to
either backend via `REACT_APP_API_BASE`.

## Deliverables (status)

| Item                                                            | Status        |
|-----------------------------------------------------------------|---------------|
| React frontend (Login, Products, Details, Cart, Checkout, Conf.)| ✅ 2026-02-28 |
| FastAPI mirror for preview (MongoDB)                            | ✅ 2026-02-28 |
| PHP backend (`api/db.php`, `login`, `users`, `products`, `orders`)| ✅ 2026-02-28 |
| MySQL schema + seed (3 users, 6 products)                       | ✅ 2026-02-28 |
| `.htaccess` for React Router + caching                          | ✅ 2026-02-28 |
| Step-by-step Hostinger deployment guide                         | ✅ 2026-02-28 |
| Stable `data-testid` selectors on every interactive element     | ✅ 2026-02-28 |
| Testing agent verification (backend 100%, frontend 100%)        | ✅ 2026-02-28 |

## User personas
- **QA learner** – practising Selenium/Playwright against stable selectors.
- **Demo viewer** – wants a quick visual to evaluate the site.

## Core requirements (static)
1. Frontend pages: Login, Product listing, Product details, Cart, Checkout,
   Order confirmation.
2. Login validates against backend; session in `localStorage`; logout supported.
3. Products fetched from backend; `id, name, description, price, image_url,
   category, stock`.
4. Cart add/remove/quantity, total price displayed, `localStorage` persistence.
5. Backend exposes `POST /api/login.php`, `GET /api/users.php`,
   `GET /api/products.php`, `GET /api/products.php?id=N`, `POST /api/orders.php`.
6. MySQL tables: `users`, `products`, `orders`, `order_items` with seed data.
7. DB credentials live only in `api/db.php`. Prepared statements. JSON responses.
8. Stable selectors: `login-username`, `login-password`, `login-button`,
   `product-card-{id}`, `add-to-cart-{id}`, `cart-link`, `checkout-button`, …

## What's implemented (2026-02-28)
- Full React app with `BrowserRouter`, AuthContext + CartContext, protected
  routes, clean & minimal saucedemo-like aesthetic.
- PHP API files using PDO + prepared statements, transactional order creation.
- MySQL `schema.sql` + `seed.sql` (3 users, 6 products).
- `.htaccess` that preserves `/api/*.php` and rewrites everything else to
  `index.html` for React Router.
- Complete deployment guide (`hostinger-deploy/DEPLOYMENT.md`) covering DB
  creation, build (`REACT_APP_API_BASE=/api yarn build`), upload layout, and
  smoke-tests.
- 10/10 backend tests (pytest), 100% frontend e2e via testing agent.

## Prioritised backlog
**P1**
- Replace plaintext passwords with `password_hash`/`password_verify` (current
  setup is intentionally plaintext so QA learners can see the seed).
- Server-side total recomputation in `orders.php` (currently trusts client).

**P2**
- `problem_user` quirks (e.g. broken image, swapped names) to mimic saucedemo's
  intentional bugs for negative-test practice.
- Server-side sort/filter endpoints.
- Order history page (`/orders`) backed by `GET /api/orders.php?user_id=N`.

**P3**
- CI workflow that builds React + lints PHP.
- Demo "reset DB" admin endpoint.

## Next tasks
- Wait for Hostinger DB credentials from the user, then they:
  1. Run `sql/schema.sql` + `sql/seed.sql` in phpMyAdmin.
  2. Edit `api/db.php` constants.
  3. `REACT_APP_API_BASE=/api yarn build` and upload.
