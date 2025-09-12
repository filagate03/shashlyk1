Shashlyk Mashlyk — Delivery Web App

This repo contains a complete web delivery application for “Шашлык Машлык” with:

- Admin panel: orders, couriers, and statistics
- Customer site: menu browsing, cart, and checkout
- Dockerized stack: PostgreSQL, Backend (Node/Express/Prisma), Frontend (React/Vite), Nginx

Quick start (Docker)

- Prereqs: Docker + Docker Compose
- Copy envs: `copy backend/.env.example backend/.env` (Windows PowerShell) or `cp backend/.env.example backend/.env`
- Start: `docker compose up --build`
- Open: http://localhost:3000 (admin under the same domain)

Local development (no Docker)

Backend
- `cd backend`
- `cp .env.example .env` and set `DATABASE_URL`
- `npm install`
- `npx prisma db push && npx prisma db seed`
- `npm run dev`

Frontend
- `cd web-app`
- `npm install`
- `npm run dev`

Admin access
- Default admin credentials are set in `backend/.env`: `ADMIN_USERNAME=admin`, `ADMIN_PASSWORD=admin123`

Deploy
- Use the included Dockerfiles and `docker-compose.yml`. Set appropriate envs and run `docker compose -f docker-compose.yml up -d --build` on your server. Frontend is served by Nginx with `/api` reverse-proxied to backend.

