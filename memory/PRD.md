# QA Demo Store – Product Requirements Document

## Problem statement
A saucedemo.com-style e-commerce demo for QA / Selenium / Playwright practice,
deployable to **Hostinger shared hosting** (PHP + MySQL backend, React static
frontend). A FastAPI + MongoDB mirror is kept in `/app/backend/server.py` for
local preview only; both backends expose an identical JSON contract.

## Architecture
```
React build (static) ──HTTP──▶ PHP REST API (api/*.php) ──▶ MySQL
                                       │ Bearer-token auth
                                       ▼
                                  auth_tokens table
```
For preview: FastAPI mirror at `/app/backend/server.py` (MongoDB).

## Implemented (timeline)

### 2026-02-28 – MVP (v1)
- Login + product list + product details + cart + checkout + order confirmation
- localStorage auth (no token) + cart
- 3 demo users (plaintext) + 6 products
- PHP/MySQL deliverables for Hostinger + `.htaccess` + DEPLOYMENT.md
- Testing agent: 100% backend (10/10), 100% frontend.

### 2026-02-28 – v2 (current)
- **Bearer-token auth**: `POST /api/auth/login.php` issues a 64-hex token (24h TTL); axios interceptor injects `Authorization: Bearer <token>`.
- **bcrypt** password storage everywhere (PHP `password_hash`, Python `bcrypt`).
- **MySQL schema**: `users` gains `email`, `password_hash`, `created_at`; new `auth_tokens` table. Migration v2 script preserves existing data.
- **Protected APIs**: GET/POST `/api/users.php`, GET/POST `/api/orders.php` (incl. `?user_id=N` filter). Products remain public.
- **Server-side total recomputation** in `POST /api/orders.php` — client `total`/`price` ignored; verified by tests (bogus price=999999 → final total still $69.97).
- **Order success page** redesigned with prominent checkmark and `✅ Your order has been placed` message (`data-testid="order-success-message"`).
- **User Management page** (`/users`): create users (`username` + `email` + `password` + optional names) and expand any user row to view their order history (items, totals, dates).
- **UI polish**: hover lift + emerald glow on product cards, animated button transitions, loading skeletons for products grid, subtle backdrop-blur header, gradient accent stripe on the order-success card.
- Testing agent v2: 17/17 backend, 100% frontend after fixing two regressions (checkout redirect order, cart persistence on hard reload).

## Backlog
**P1**
- Add password reset and "change my password" UI.
- Per-user role flag (`is_admin`) — restrict POST `/api/users.php` to admins.
- `problem_user` quirks (shuffled product names, broken image) like real saucedemo.
- Rate-limit `/api/auth/login.php` (currently no brute-force protection).

**P2**
- "Order history for me" UI on `/orders` (separate from User Management).
- TTL-based cleanup job for expired `auth_tokens` rows.
- Email verification flow.

**P3**
- CI workflow that builds React + lints PHP.
- "Reset demo data" admin endpoint.

## Next tasks
- Wait for the user to deploy v2 to Hostinger:
  1. Run `sql/schema.sql` + `sql/seed.sql` (fresh) OR `sql/migration_v2.sql` (upgrade) in phpMyAdmin.
  2. Confirm `api/db.php` credentials.
  3. `REACT_APP_API_BASE=/api yarn build` and upload `frontend/build/*`, `.htaccess`, `api/*` (including new `api/auth/login.php`) to `public_html/`.
