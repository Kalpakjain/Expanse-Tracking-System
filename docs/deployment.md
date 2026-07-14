# Deployment Guide

This repository is set up for a practical full-stack deployment path without tying the app to a single hosting vendor.

## Runtime Shape

Production services:

- `frontend`: Next.js web app
- `backend`: FastAPI API
- `postgres`: relational database
- `redis`: cache and optional background-job support

## Environment Variables

### Frontend

- `NEXT_PUBLIC_API_BASE_URL`

This should point to the public backend base URL that the browser can reach.

### Backend

- `APP_NAME`
- `APP_ENV`
- `APP_HOST`
- `APP_PORT`
- `FRONTEND_ORIGINS`
- `DATABASE_URL`
- `DATABASE_AUTO_CREATE_TABLES`
- `REDIS_URL`
- `AUTH_SECRET_KEY`
- `AUTH_TOKEN_TTL_MINUTES`
- `AUTH_REQUIRED`

Use [`backend/.env.example`](../backend/.env.example) and [`frontend/.env.example`](../frontend/.env.example) as starting points.
Use [`backend/.env.production.example`](../backend/.env.production.example) and [`frontend/.env.production.example`](../frontend/.env.production.example) for hosted environments.

For production, set `DATABASE_AUTO_CREATE_TABLES=false` and run:

```bash
cd backend
alembic upgrade head
```

The backend container already runs `alembic upgrade head` before starting Uvicorn.

Production startup intentionally fails if:

- `AUTH_SECRET_KEY` is still the development default or too short
- `AUTH_REQUIRED` is not `true`
- `DATABASE_AUTO_CREATE_TABLES` is not `false`
- `DATABASE_URL` points to SQLite
- `FRONTEND_ORIGINS` is local or not HTTPS

## Local Container Run

```bash
make up
```

This uses [`infra/docker-compose.yml`](../infra/docker-compose.yml) with PostgreSQL and Redis.

## CI Pipeline

GitHub Actions runs two checks on pushes and pull requests:

- backend package install and Python compile check
- frontend dependency install and production build

See [`ci.yml`](../.github/workflows/ci.yml).

## Public Go-Live Checklist

1. Provision a public URL for the frontend.
2. Provision a public URL for the backend.
3. Set `NEXT_PUBLIC_API_BASE_URL` to the backend URL.
4. Set `FRONTEND_ORIGINS` to the frontend URL.
5. Provision PostgreSQL and Redis.
6. Point `DATABASE_URL` and `REDIS_URL` to hosted services.
7. Set a long random `AUTH_SECRET_KEY`.
8. Run `alembic upgrade head` against the production database.
9. Turn on HTTPS for both app surfaces.
10. Run the CI pipeline on the default branch before release.

## What Is Still Missing For A True Live Launch

The codebase is deploy-ready, but a public launch still needs external credentials that cannot be committed into the repository:

- hosting account access
- domain and DNS control
- database credentials
- Redis credentials
- WhatsApp provider credentials, if real message delivery is enabled
- object-storage credentials, if receipt file persistence moves beyond local metadata
