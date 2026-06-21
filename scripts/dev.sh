#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Docker não encontrado. Instale o Docker para usar pnpm dev."
  exit 1
fi

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  echo "ℹ️  Criado .env na raiz (DB_PASSWORD para o docker compose)."
fi

# Garante credenciais para o compose mesmo sem .env na raiz.
export DB_PASSWORD="${DB_PASSWORD:-postgres}"
export REDIS_PASSWORD="${REDIS_PASSWORD:-redis_dev_local}"

echo "🐳 Subindo Postgres e Redis (volume persistente tech4um_postgres_data)..."
docker compose -f docker-compose.infra.yml up -d postgres redis --wait

echo "🚀 Iniciando frontend, backend e shared..."
exec turbo run dev
