# Estágio 1: Instalar dependências e construir o projeto
FROM node:22 AS builder

# Define o diretório de trabalho
WORKDIR /usr/src/app

# Copia os arquivos de pacote e instala TODAS as dependências (incluindo as de dev)
COPY package*.json ./
RUN npm install

# Copia todo o resto do código-fonte
COPY . .

# Gera o cliente do Prisma com base no seu schema
RUN npx prisma generate

# Constrói a aplicação (compila de TypeScript para JavaScript)
RUN npm run build

# ---

# Estágio 2: Imagem final, otimizada para produção
FROM node:22-slim

WORKDIR /usr/src/app

# Copia apenas os node_modules de produção e o código compilado do estágio 'builder'
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/package*.json ./

# Expõe a porta em que a aplicação NestJS vai rodar
EXPOSE 3001

# O comando para iniciar a aplicação
CMD ["node", "dist/main"]