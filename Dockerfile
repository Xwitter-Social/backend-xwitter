# Estágio 1: Instalar dependências e construir o projeto
FROM node:22 AS builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .

RUN npx prisma generate
RUN npm run build

# ---

# Estágio 2: Imagem final
FROM node:22-slim

RUN apt-get update && apt-get install -y openssl procps && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copia node_modules e tudo que o código precisa
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/src ./src 

EXPOSE 3001

CMD ["node", "dist/main"]
