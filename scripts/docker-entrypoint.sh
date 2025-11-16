#!/bin/bash
set -e

export NODE_ENV="${NODE_ENV:-development}"
export ENABLE_STARTUP_SEED="${ENABLE_STARTUP_SEED:-true}"

echo "🚀 Iniciando aplicação (NODE_ENV=$NODE_ENV)..."

DB_HOST="db"
DB_PORT="5432"

if [ -n "$DATABASE_URL" ]; then
  DB_HOST=$(node -e "const url = new URL(process.argv[1]); console.log(url.hostname || 'db');" "$DATABASE_URL")
  DB_PORT=$(node -e "const url = new URL(process.argv[1]); console.log(url.port || '5432');" "$DATABASE_URL")
fi

echo "⏳ Aguardando PostgreSQL estar disponível em $DB_HOST:$DB_PORT..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done
echo "✅ PostgreSQL está disponível!"

echo "🔄 Executando migrações do Prisma..."
npx prisma migrate deploy

echo "⚙️ Gerando cliente Prisma..."
npx prisma generate

if [ "$ENABLE_STARTUP_SEED" = "true" ] && [ "$NODE_ENV" != "production" ]; then
  echo "🌱 Executando seed de desenvolvimento..."
  npx prisma db seed
else
  echo "🌱 Seed automático desabilitado (ENABLE_STARTUP_SEED=$ENABLE_STARTUP_SEED, NODE_ENV=$NODE_ENV)."
fi

echo "🎯 Iniciando aplicação NestJS..."
exec "$@"