COMPOSE_FILE=infra/docker-compose.yml

.PHONY: up down logs backend-dev frontend-dev backend-check backend-test backend-migrate frontend-build ci

up:
	docker compose -f $(COMPOSE_FILE) up --build

down:
	docker compose -f $(COMPOSE_FILE) down

logs:
	docker compose -f $(COMPOSE_FILE) logs -f

backend-dev:
	cd backend && ./.venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend-dev:
	cd frontend && npm run dev

backend-check:
	cd backend && ./.venv/bin/python -m compileall app tests

backend-test:
	cd backend && ./.venv/bin/python -m pytest

backend-migrate:
	cd backend && ./.venv/bin/alembic upgrade head

frontend-build:
	cd frontend && npm run build

ci: backend-check backend-test frontend-build
