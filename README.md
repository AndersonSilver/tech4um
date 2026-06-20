# Tech4um — Monorepo (Turborepo)

![CI](https://github.com/AndersonSilver/tech4um/actions/workflows/ci.yml/badge.svg)

Fórum de conversas em tempo real. Monorepo gerenciado com **Turborepo** + **pnpm workspaces**.

## Stack

- **Backend:** Node.js, TypeScript (POO), Express, TypeORM, PostgreSQL, Socket.IO
- **Frontend:** React + Vite + TypeScript + Tailwind (design 1:1 com o Figma via Figma MCP)
- **Shared:** pacote `@tech4um/shared` com tipos, DTOs e contratos de eventos de WebSocket compartilhados entre backend e frontend
- **Monorepo:** Turborepo + pnpm
- **CI:** GitHub Actions (lint, typecheck, testes e build em cada push/PR)

## Estrutura

```
tech4um/
├── apps/
│   ├── backend/     # API REST + WebSocket
│   └── frontend/     # SPA React
├── packages/
│   └── shared/        # Tipos, DTOs e eventos de socket compartilhados (fonte única de verdade)
├── .github/workflows/ci.yml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

> `packages/shared` evita duplicar interfaces (`User`, `Forum`, `Message`, eventos de socket) entre backend e frontend — qualquer mudança no contrato de dados é feita em um único lugar.

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

### 3. Buildar o pacote compartilhado (necessário antes do primeiro dev/build)
```bash
pnpm --filter @tech4um/shared build
```
> O Turborepo já orquestra essa dependência automaticamente quando você roda `pnpm dev` ou `pnpm build` na raiz — este passo manual só é necessário se for rodar `apps/backend` ou `apps/frontend` isoladamente antes de qualquer build orquestrado.

### 4. Configurar variáveis de ambiente
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```
Ajuste as credenciais do banco em `apps/backend/.env`.

#### Login com Google
1. Crie um OAuth Client ID (tipo "Web application") em https://console.cloud.google.com/apis/credentials
2. Adicione `http://localhost:5173` em "Authorized JavaScript origins"
3. Copie o Client ID para `GOOGLE_CLIENT_ID` (backend) e `VITE_GOOGLE_CLIENT_ID` (frontend)

### 5. Criar o banco de dados
```bash
createdb tech4um
```
(o TypeORM com `synchronize: true` cria as tabelas automaticamente em desenvolvimento)

### 6. Rodar tudo em paralelo (Turborepo)
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

## Segurança

Após uma avaliação interna (simulando o que um pentest básico cobriria), os seguintes pontos foram endurecidos:

### 🔴 Críticos corrigidos
- **Sem segredo fraco/padrão em lugar nenhum** — `JWT_SECRET` e a senha do Postgres não têm mais valor default no `docker-compose.yml`; o compose falha explicitamente (`:?mensagem`) se não forem definidos via variável de ambiente. `TokenService` também valida em runtime que o secret tem no mínimo 16 caracteres.
- **Rate limiting** em `/auth/login`, `/auth/register`, `/auth/google` (10 tentativas / 15 min por IP) e um limite geral na API (120 req/min). Mitiga brute-force e DoS simples.
- **Token de autenticação migrado de `localStorage` para cookie `httpOnly` + `Secure` (produção) + `SameSite=Strict`** — JavaScript não consegue mais ler o token, mesmo com XSS. `SameSite=Strict` também mitiga CSRF na grande maioria dos cenários.
- **Mensagem de erro de cadastro anti-enumeração** — não revela mais se um e-mail específico já está cadastrado (username continua revelando, por ser um identificador público).
- **`synchronize: true` do TypeORM agora é condicionado a `NODE_ENV !== "production"`** — nunca mais altera schema de produção sem migration.

### 🟠 Médios corrigidos
- **Helmet** habilitado (headers de segurança padrão: HSTS, X-Content-Type-Options, remoção de `X-Powered-By` etc.).
- **Limite de tamanho de payload** (`express.json({ limit: "100kb" })`) — mitiga DoS por payload gigante.
- **Revogação de sessão (logout real)** — `POST /auth/logout` adiciona o `jti` do token a uma blacklist em memória, verificada em toda requisição autenticada e também nos WebSockets. Um token roubado/antigo não funciona mais após logout.
- **Tempo de vida do token reduzido** de 1 dia para 2h por padrão (configurável via `JWT_EXPIRES_IN`).
- **CORS estrito** — sem fallback para `*`; em produção, a inicialização falha se `CORS_ORIGIN` não estiver definido.
- **Política de senha** — mínimo 8 caracteres, exigindo maiúscula, minúscula e número.
- **Revalidação periódica de sessão no WebSocket** (a cada 5 min) — desconecta o socket se o token foi revogado nesse meio tempo.

### 🟡 Baixos corrigidos
- **`pnpm audit --audit-level=high`** adicionado ao pipeline de CI (não bloqueia o build, mas reporta no log).
- **Validação e rate limiting de mensagens no WebSocket** — conteúdo vazio/maior que 2000 caracteres é rejeitado; no máximo 20 mensagens por 10s por conexão.
- **Mensagem privada agora valida que o destinatário realmente participa do fórum** antes de permitir o envio (evita enviar "mensagem privada" para qualquer `userId` arbitrário fora de contexto).

### Limitações conhecidas (não implementadas — exigem infraestrutura externa)
- **CAPTCHA/anti-bot** (ex.: hCaptcha, Cloudflare Turnstile) — o rate limiting reduz o risco, mas não substitui um CAPTCHA real contra automação distribuída.
- **Verificação de e-mail no cadastro** — hoje qualquer e-mail é aceito sem confirmação; um fluxo completo exigiria infraestrutura de envio de e-mail (SMTP/SES).
- **Blacklist de tokens em memória** — funciona para uma única instância do processo. Em deploy com múltiplas réplicas, um logout não se propaga entre instâncias; produção deveria usar um store compartilhado (Redis com TTL).
- **MFA (autenticação em dois fatores)** — não implementado.

## Autenticação

- Login/cadastro com e-mail e senha (hash com bcrypt, política de senha forte)
- Login social com Google (Google Identity Services no frontend + verificação do `idToken` com `google-auth-library` no backend)
- Usuários criados via Google não possuem senha até que decidam definir uma (campo `passwordHash` é opcional na entidade `User`)
- Sessão via cookie `httpOnly` (não acessível via JavaScript) com revogação real no logout

