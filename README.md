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
Abra seu terminal e clone o projeto para a sua máquina.
```bash
git clone [https://github.com/rafgpereira/backend-twitter.git](https://github.com/rafgpereira/backend-twitter.git)
cd backend-social
```

**2. Crie o arquivo de ambiente (.env)**

O projeto precisa de um arquivo `.env` para configurar a conexão com o banco de dados. Você pode criá-lo a partir do arquivo de exemplo fornecido.
```bash
cp .env.example .env
```
> O arquivo `.env.example` deve ser versionado no Git com as chaves necessárias, mas sem valores sensíveis. O `.env` nunca deve ser versionado.

**3. Construa as imagens e suba os contêineres**

Este comando irá ler o `docker-compose.yml`, construir a imagem da sua aplicação NestJS e iniciar os contêineres do backend e do banco de dados em segundo plano.
```bash
docker compose up --build -d
```

**4. Execute a migração inicial do banco de dados**
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