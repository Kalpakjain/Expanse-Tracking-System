COMPOSE_FILE=infra/docker-compose.yml

.PHONY: up down logs backend-dev frontend-dev

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
