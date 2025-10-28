#!/bin/bash
set -e

echo "🚀 Iniciando aplicação..."

echo "⏳ Aguardando PostgreSQL estar disponível..."
while ! nc -z db 5432; do
  sleep 1
done
echo "✅ PostgreSQL está disponível!"

echo "🔄 Executando migrações do Prisma..."
npx prisma migrate deploy

echo "⚙️ Gerando cliente Prisma..."
npx prisma generate

echo "🧪 Executando testes..."
npm run test

echo "🎯 Iniciando aplicação NestJS..."
exec "$@"