# pastebin-lite
A minimal Pastebin-like application built using React (Vite), Node.js + Express, and Neon Postgres.
Users can create text pastes with optional expiration (TTL) and maximum view limits.

Tech Stack

Frontend: React, Vite, React Router

Backend: Node.js, Express

Database: Neon (PostgreSQL)

Hosting: Vercel (frontend), Render (backend)

Environment Variables
Backend (backend/.env)
PORT=4000
DATABASE_URL=postgres://<neon-connection-string>
TEST_MODE=0

Frontend (frontend/.env)
VITE_API_URL=http://localhost:4000

.env files are not committed.

Database Setup (Neon)

Run once in Neon SQL editor:

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE pastes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT,
  remaining_views INTEGER
);

Run Locally:
Backend:
cd backend
npm install
npm run dev


Runs at http://localhost:4000

Frontend:
cd frontend
npm install
npm run dev


Runs at http://localhost:5173

API Endpoints:

POST /api/pastes → create paste

GET /api/pastes/:id → fetch paste (decrements views)

GET /api/view/:id → view paste (no decrement)

GET /p/:id → HTML page (no decrement)

Deployment
Backend (Render)

Root: backend

Build: npm install

Start: npm start

Env: DATABASE_URL

Frontend (Vercel)

Root: frontend

Build: npm run build

Output: dist

Env: VITE_API_URL=<render-backend-url>

Notes

View count is decremented only via API, not via HTML page

Behavior matches automated test expectations.