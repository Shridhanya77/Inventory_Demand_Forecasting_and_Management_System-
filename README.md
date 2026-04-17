# Multi-Branch IoT Inventory Management System

This workspace contains a full-stack inventory system with multi-branch support, role-based access control, QR code generation, and mobile-ready APIs.

## Backend

Path: `backend`

Features:
- Express.js API
- PostgreSQL integration via `pg`
- JWT authentication
- Admin / staff / student workflows
- QR code generation for students and components
- Transfer request approval flow

Setup:
1. Copy `backend/.env.example` to `backend/.env`
2. Install dependencies: `cd backend && npm install`
3. Create an empty database in PostgreSQL (name must match `PGDATABASE` in `.env`, e.g. `inventory_db`), then run **`npm run db:setup`** inside `backend` to apply `schema.sql`. You can still run `schema.sql` manually in pgAdmin if you prefer.
4. If you already had an older database (before `center_manager` in schema), run `backend/migrations/001_extend_user_roles.sql` once.
5. Run **`npm run seed`** — adds the nine internship centers if missing and default admin on **Belagavi** (`admin@inventory.local` / `Admin@123` when newly created).
6. Start server: `npm run dev`
7. Keep `DEV_BYPASS_LOGIN=false` in `.env` so only real database users can log in (staff/manager register at `/register`; admin comes from seed).

## Frontend

Path: `frontend`

Features:
- React + Vite UI
- Material UI dashboard layout
- Login page and email registration (`/register`) for staff and center managers
- Admin and staff views
- QR scanning using `react-qr-reader`

Setup:
1. Install dependencies: `cd frontend && npm install`
2. Start dev server: `npm run dev`
3. Optional: `npm start` also runs Vite

## API Notes

Auth (staff / center manager):

- `GET /api/auth/branches` — list branches (for registration form)
- `POST /api/auth/register` — body: `{ name, email, password, role: "staff" | "center_manager", branch_id }` (password min 8 characters; admin cannot self-register)

Mobile-ready endpoints:
- `POST /api/student/login`
- `GET /api/student/qr?student_id={id}`
- `GET /api/student/history?student_id={id}`

Backend base URL: `http://localhost:4000/api`

## Database Schema

Tables:
- `users`
- `branches`
- `students`
- `components`
- `branch_stock`
- `transactions`
- `transaction_items`
- `transfer_requests`
- `audit_logs`
