#!/bin/bash

echo "🚀 Iniciando aplicação..."

# Aguarda o banco estar disponível
echo "⏳ Aguardando PostgreSQL estar disponível..."
while ! nc -z db 5432; do
  sleep 1
done
echo "✅ PostgreSQL está disponível!"

# Executa as migrações
echo "🔄 Executando migrações do Prisma..."
npx prisma migrate deploy

# Gera o cliente Prisma (caso necessário)
echo "⚙️ Gerando cliente Prisma..."
npx prisma generate

# Inicia a aplicação
echo "🎯 Iniciando aplicação NestJS..."
exec "$@"
