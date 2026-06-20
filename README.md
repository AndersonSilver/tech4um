# Tech4um — Monorepo (Turborepo)

Fórum de conversas em tempo real. Monorepo gerenciado com **Turborepo** + **pnpm workspaces**.

## Stack

- **Backend:** Node.js, TypeScript (POO), Express, TypeORM, PostgreSQL, Socket.IO
- **Frontend:** React + Vite + TypeScript + Tailwind (design 1:1 com o Figma via Figma MCP)
- **Monorepo:** Turborepo + pnpm

## Estrutura

```
tech4um/
├── apps/
│   ├── backend/     # API REST + WebSocket
│   └── frontend/     # SPA React
├── packages/
│   └── shared/        # (reservado para tipos/utilitários compartilhados)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Como rodar com Docker (recomendado)

```bash
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com docker compose up --build
```
- Frontend: http://localhost:5173
- Backend: http://localhost:3333
- Postgres: localhost:5432 (usuário/senha `postgres`)

## Como rodar localmente sem Docker

### 1. Pré-requisitos
- Node.js 20+
- pnpm (`npm i -g pnpm`)
- PostgreSQL rodando localmente (ou via Docker)

### 2. Instalar dependências
```bash
pnpm install
```

### 3. Configurar variáveis de ambiente
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```
Ajuste as credenciais do banco em `apps/backend/.env`.

#### Login com Google
1. Crie um OAuth Client ID (tipo "Web application") em https://console.cloud.google.com/apis/credentials
2. Adicione `http://localhost:5173` em "Authorized JavaScript origins"
3. Copie o Client ID para `GOOGLE_CLIENT_ID` (backend) e `VITE_GOOGLE_CLIENT_ID` (frontend)

### 4. Criar o banco de dados
```bash
createdb tech4um
```
(o TypeORM com `synchronize: true` cria as tabelas automaticamente em desenvolvimento)

### 5. Rodar tudo em paralelo (Turborepo)
```bash
pnpm dev
```
Isso executa `dev` no backend (`http://localhost:3333`) e no frontend (`http://localhost:5173`) simultaneamente, com cache e orquestração do Turborepo.

### Rodar individualmente
```bash
pnpm --filter @tech4um/backend dev
pnpm --filter @tech4um/frontend dev
```

## Build de produção
```bash
pnpm build
```

## Design

O frontend foi implementado a partir do protótipo oficial no Figma, extraindo cores, tipografia (Poppins/Roboto), espaçamentos e componentes diretamente via Figma MCP, garantindo fidelidade visual ao design.

## Testes automatizados

```bash
# Backend (Jest) — AuthService, hashing de senha, regras de visibilidade de mensagens
pnpm --filter @tech4um/backend test

# Frontend (Vitest) — ForumCard, MessageBubble
pnpm --filter @tech4um/frontend test

# Ou os dois em paralelo via Turborepo
pnpm test
```

## Deploy

Este projeto está pronto para deploy em qualquer provedor com suporte a Docker (Railway, Render, Fly.io) ou containers separados:

- **Backend + Postgres:** Railway/Render — usar `apps/backend/Dockerfile`, configurando as variáveis de `.env.example` (incluindo `GOOGLE_CLIENT_ID`)
- **Frontend:** Vercel/Netlify (build estático) ou `apps/frontend/Dockerfile` (Nginx) — configurar `VITE_API_URL`, `VITE_SOCKET_URL` e `VITE_GOOGLE_CLIENT_ID` apontando para a URL pública do backend
- Lembre-se de adicionar a URL pública do frontend em **Authorized JavaScript origins** no Google Cloud Console

> Observação: o deploy efetivo (criar as contas/projetos nos provedores) precisa ser feito por vocês — aqui deixamos toda a configuração (Dockerfiles, compose, variáveis) pronta para isso.

## Autenticação

- Login/cadastro com e-mail e senha (hash com bcrypt)
- Login social com Google (Google Identity Services no frontend + verificação do `idToken` com `google-auth-library` no backend)
- Usuários criados via Google não possuem senha até que decidam definir uma (campo `passwordHash` é opcional na entidade `User`)

