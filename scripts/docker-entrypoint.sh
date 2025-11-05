#!/bin/bash
set -e

export NODE_ENV="${NODE_ENV:-development}"
export ENABLE_STARTUP_SEED="${ENABLE_STARTUP_SEED:-true}"

echo "🚀 Iniciando aplicação (NODE_ENV=$NODE_ENV)..."

echo "⏳ Aguardando PostgreSQL estar disponível..."
while ! nc -z db 5432; do
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