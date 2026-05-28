# QA Demo Store – Product Requirements Document

## Problem statement
A saucedemo.com-style e-commerce demo for QA / Selenium / Playwright practice,
deployable to **Hostinger shared hosting** (PHP + MySQL backend, React static
frontend). A FastAPI + MongoDB mirror is kept in `/app/backend/server.py` for
local preview only; both backends expose an identical JSON contract.

## Implemented (timeline)

### 2026-02-28 – v1 MVP
- Login + product list + product details + cart + checkout + order confirmation.
- localStorage auth + cart. 3 plaintext demo users + 6 products. PHP/MySQL deliverables.

### 2026-02-28 – v2
- Bearer-token auth (`POST /api/auth/login.php`, 24h TTL).
- bcrypt password storage; `users` gains email/password_hash/created_at; new `auth_tokens` table.
- Protected `/api/users.php` (CRUD) + `/api/orders.php`.
- Server-side total recomputation.
- Order success page with checkmark + ✅ message.
- User Management page in React.
- Testing agent: 17/17 backend, 100% FE after 2 fixes.

### 2026-02-28 – v3 (current)
- **Login page cleanup**: removed hardcoded "Accepted users" / password block; empty placeholders; added Sign-up link.
- **Public signup**: new `POST /api/signup.php` (also in PHP). Validates username pattern, email format, ≥6-char password; bcrypt-hashes; rejects duplicates (400). Redirects to /login with success toast.
- **User Management removed**: dropped `users-link` from header, deleted `UserManagement.jsx`, removed `POST /api/users.php` and `GET /api/users.php` endpoints from both backends.
- **My Orders page** (`/orders`) replaces user management — shows the current user's own orders via `GET /api/orders.php` (now defaults to the authenticated user; `?user_id=N` still works).
- **Checkout simplified**: only `full_name + address + city + state + pincode + phone`; payment fields removed. Schema migrated via `sql/migration_v3.sql`.
- **Toast notifications** via sonner — login/signup/logout/order success+failure all surface as toasts (top-right, rich colors).
- **`/api/profile.php`** added for the logged-in user.
- **Testing agent v3**: 28/28 backend pytest, 100% frontend E2E. Zero outstanding issues. (Iteration-2 redirect bug fixed by a `submitted` flag in Checkout.)

## Backlog
**P1**
- Rate-limit `/api/auth/login.php` & `/api/signup.php` against brute force.
- "Forgot password" → email reset flow (uses Hostinger SMTP / Resend).
- Admin role + admin-only screens (re-introduce a guarded `/users` page).

**P2**
- TTL cleanup cron for `auth_tokens`.
- `problem_user` quirks (shuffled product names, broken image) for negative-test practice.
- Order status updates (pending → shipped → delivered) + filterable Orders page.

**P3**
- CI workflow: build React + lint PHP.
- Demo "reset DB" admin endpoint.

## Next tasks
- Deploy v3 to Hostinger:
  1. phpMyAdmin → run `sql/schema.sql` + `sql/seed.sql` (fresh) OR `sql/migration_v3.sql` (upgrade).
  2. Verify `api/db.php` constants.
  3. `REACT_APP_API_BASE=/api yarn build`; upload `frontend/build/*`, `.htaccess`, and `api/` (incl. new `api/signup.php`, `api/profile.php`, removed `api/users.php`).
