# Sistema Distribuído de Cadastro de Mensagem

Aplicação web minimalista com estética de terminal CRT que exibe mensagens aleatórias de um banco de dados e permite que qualquer usuário cadastre novas mensagens.

## Como funciona

A tela exibe uma mensagem aleatória centralizada. O usuário tem duas ações disponíveis:

- **Refresh** — troca a mensagem atual por outra aleatória do banco, evitando repetir a anterior. Também acionado com `Space` ou `→`.
- **Compose** — campo de texto no rodapé para cadastrar uma nova mensagem (até 280 caracteres). Ao confirmar, a mensagem é salva no banco e exibida imediatamente na tela. Foco rápido com `/`, blur com `Esc`.

O contador de linhas (`ROWS`) no topo é atualizado em tempo real após cada POST.

## Stack

| Camada    | Tecnologia                              |
|-----------|-----------------------------------------|
| Backend   | Node.js + Express                       |
| Banco     | PostgreSQL                              |
| Frontend  | HTML + CSS + JavaScript (sem framework) |
| Container | Docker + Docker Compose                 |

O Express serve os arquivos estáticos do frontend e expõe três endpoints REST:

| Método | Rota                   | Descrição                                                       |
|--------|------------------------|-----------------------------------------------------------------|
| GET    | `/api/messages/random` | Retorna uma mensagem aleatória (`?exclude=<id>` opcional)       |
| POST   | `/api/messages`        | Cadastra nova mensagem (`{ "text": string }`)                   |
| GET    | `/api/messages/count`  | Retorna o total de mensagens (`{ total }`)                      |

O banco é inicializado automaticamente com 20 mensagens de seed na primeira execução.

## Como utilizar

### Desenvolvimento local (Docker)

Sobe a aplicação e um PostgreSQL juntos com um único comando:

```bash
docker compose up --build
```

Acesse `http://localhost:3000`. Os dados persistem no volume `msg_data` entre restarts.

Para rodar em background:

```bash
docker compose up -d --build
```

Para parar:

```bash
docker compose down
```

Para destruir também os dados persistidos:

```bash
docker compose down -v
```

### Produção (múltiplas instâncias)

Em produção o banco roda em uma instância separada e as instâncias de app apontam para ele via variável de ambiente. O `docker-compose.yml` não é usado — cada instância de app roda apenas o container da aplicação.

**1. Na EC2 de banco** — instale e configure o PostgreSQL, crie o banco e o usuário:

```sql
CREATE DATABASE mensagens;
CREATE USER msguser WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE mensagens TO msguser;
```

**2. Em cada EC2 de app** — clone o repositório, crie um arquivo `.env` com a connection string apontando para o IP privado da EC2 de banco:

```bash
DATABASE_URL=postgres://msguser:sua_senha@<IP-PRIVADO-DO-BANCO>:5432/mensagens
PORT=3000
```

**3.** Suba o container passando o `.env`:

```bash
docker build -t sistema-mensagens .
docker run -d --env-file .env -p 3000:3000 --restart unless-stopped sistema-mensagens
```

## Variáveis de ambiente

| Variável       | Obrigatória | Descrição                          |
|----------------|-------------|------------------------------------|
| `DATABASE_URL` | Sim         | Connection string do PostgreSQL    |
| `PORT`         | Não         | Porta do servidor (padrão: `3000`) |

## Estrutura do projeto

```
├── server.js          # Servidor Express e rotas da API
├── db.js              # Pool de conexão, criação da tabela e seed
├── public/
│   └── index.html     # Frontend completo (HTML + CSS + JS)
├── Dockerfile         # Imagem da aplicação (node:20-alpine)
├── docker-compose.yml # Dev: app + PostgreSQL com healthcheck
└── package.json
```
