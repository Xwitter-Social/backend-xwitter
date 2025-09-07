# Backend - Clone do Twitter

Este repositório contém o código-fonte para o serviço de backend de uma aplicação de rede social similar ao Twitter. O projeto é desenvolvido com foco em boas práticas de engenharia de software, utilizando uma arquitetura moderna e totalmente containerizada.

## Tecnologias Utilizadas
- **Framework:** [NestJS](https://nestjs.com/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Ambiente:** [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

---

## Pré-requisitos
Antes de começar, garanta que você tenha as seguintes ferramentas instaladas na sua máquina:
- [Git](https://git-scm.com/)
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (geralmente já vem com a instalação do Docker Desktop ou do Docker Engine no Linux).

**Nota:** Você **não** precisa instalar Node.js ou PostgreSQL na sua máquina, pois o Docker cuidará de todo o ambiente.

---

## Como Rodar o Projeto (Setup Inicial)

Siga estes passos para configurar e executar o ambiente de desenvolvimento localmente.

**1. Clone o repositório**
```bash
git clone https://github.com/rafgpereira/backend-twitter.git
cd backend-twitter
```

**2. Crie o arquivo de ambiente (.env)**
```bash
cp .env.example .env
```
> O arquivo `.env` já vem com as configurações corretas para o ambiente Docker.

**3. Inicie os serviços (Primeira execução)**
```bash
docker-compose up --build
```

🎉 **Pronto!** O sistema agora irá:
- ✅ Construir as imagens Docker
- ✅ Iniciar o PostgreSQL
- ✅ Aguardar o banco estar disponível
- ✅ **Executar automaticamente as migrações**
- ✅ Gerar o cliente Prisma
- ✅ Iniciar a aplicação NestJS

A aplicação estará disponível em: `http://localhost:3001`

**Para próximas execuções:**
```bash
docker-compose up
```
Após os contêineres estarem no ar, o banco de dados estará criado, mas vazio. Este comando executa as migrações do Prisma para criar todas as tabelas necessárias.

**Este passo é crucial e só precisa ser feito uma vez durante o setup inicial.**

```bash
docker compose exec backend npx prisma migrate deploy
```

**5. Pronto! A aplicação está rodando**
Seu ambiente de desenvolvimento está completo e funcional.
- A API estará acessível em: `http://localhost:3001`
- O banco de dados estará acessível em: `localhost:5432`


---

## Fluxo de Trabalho de Banco de Dados

Toda vez que você precisar alterar a estrutura do banco de dados (criar tabelas, adicionar colunas, etc.), o fluxo de trabalho é o seguinte:

1.  Garanta que seus contêineres estejam rodando (`docker compose up -d`).
2.  Altere o arquivo `prisma/schema.prisma` com as modificações desejadas.
3.  Execute o comando `migrate dev` para que o Prisma crie um novo arquivo de migração e aplique as mudanças no banco de dados.
    ```bash
    docker compose exec backend npx prisma migrate dev --name "nome-descritivo-da-alteracao"
    ```

---

## Comandos Úteis do Docker

Aqui está uma lista de comandos que você usará com frequência no dia a dia.

- **Iniciar o ambiente (em segundo plano):**
  ```bash
  docker compose up -d
  ```

- **Parar e remover os contêineres:**
  ```bash
  docker compose down
  ```

- **Ver os logs da API em tempo real:**
  ```bash
  docker compose logs -f backend
  ```

- **Ver os contêineres em execução:**
  ```bash
  docker ps
  ```