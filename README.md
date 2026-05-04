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
| Banco     | SQLite via `better-sqlite3`             |
| Frontend  | HTML + CSS + JavaScript (sem framework) |
| Container | Docker + Docker Compose                 |

O Express serve os arquivos estáticos do frontend e expõe três endpoints REST:

| Método | Rota                   | Descrição                                      |
|--------|------------------------|------------------------------------------------|
| GET    | `/api/messages/random` | Retorna uma mensagem aleatória (`?exclude=<id>` opcional) |
| POST   | `/api/messages`        | Cadastra nova mensagem (`{ "text": string }`)  |
| GET    | `/api/messages/count`  | Retorna o total de mensagens (`{ total }`)     |

O banco SQLite é inicializado automaticamente com 20 mensagens de seed na primeira execução.

## Como utilizar

### Pré-requisitos

- Node.js 20+ **ou** Docker + Docker Compose

### Desenvolvimento local

```bash
npm install
npm start
```

Acesse `http://localhost:3000`. O banco é criado em `./data/messages.db`.

Para desenvolvimento com hot-reload (Node.js 18+):

```bash
npm run dev
```

### Com Docker (recomendado)

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

## Variáveis de ambiente

| Variável   | Padrão       | Descrição                        |
|------------|--------------|----------------------------------|
| `PORT`     | `3000`       | Porta em que o servidor escuta   |
| `DATA_DIR` | `./data`     | Diretório onde o SQLite é salvo  |

## Estrutura do projeto

```
├── server.js          # Servidor Express e rotas da API
├── db.js              # Inicialização do SQLite e seed
├── public/
│   └── index.html     # Frontend completo (HTML + CSS + JS)
├── Dockerfile         # Build multi-stage (Alpine)
├── docker-compose.yml # Orquestração com volume persistente
└── package.json
```
