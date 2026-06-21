#!/usr/bin/env bash
# Executado na VPS (manual ou via GitHub Actions SSH).
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/tech4um}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
BRANCH="${DEPLOY_BRANCH:-main}"

echo "==> Tech4um deploy em ${APP_DIR} (branch ${BRANCH})"

if [[ ! -d "${APP_DIR}/.git" ]]; then
  echo "Erro: ${APP_DIR} não é um clone git. Rode o setup inicial (ver deploy/HOSTINGER.md)."
  exit 1
fi

cd "${APP_DIR}"

if [[ ! -f .env ]]; then
  echo "Erro: arquivo .env ausente em ${APP_DIR}. Copie .env.production.example para .env."
  exit 1
fi

git fetch origin "${BRANCH}"
git reset --hard "origin/${BRANCH}"

# VPS com pouca CPU: build serial evita timeout e contenção entre backend/frontend.
export COMPOSE_PARALLEL_LIMIT=1
export DOCKER_BUILDKIT=1

docker compose -f "${COMPOSE_FILE}" up -d --build --remove-orphans

docker compose -f "${COMPOSE_FILE}" ps

# Limpa imagens dangling (não remove volumes)
docker image prune -f >/dev/null 2>&1 || true

echo "==> Deploy concluído."
