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

Este projeto está pronto para deploy em qualquer provedor com suporte a Docker (Railway, Render, Fly.io) ou em uma VPS própria.

### Deploy em VPS (ex.: Hostinger) com Docker Compose

1. **Acesse a VPS via SSH** e instale Docker + Docker Compose (a Hostinger tem template de Ubuntu com Docker pré-instalado).
2. **Clone o repositório** e entre na pasta.
3. **Crie um arquivo `.env` na raiz** (lido automaticamente pelo `docker compose`) com os segredos reais:
   ```bash
   JWT_SECRET=$(openssl rand -hex 32)
   ENCRYPTION_KEY=$(openssl rand -hex 32)
   DB_PASSWORD=uma_senha_forte
   CORS_ORIGIN=https://seudominio.com
   FRONTEND_URL=https://seudominio.com
   VITE_API_URL=https://api.seudominio.com/api
   VITE_SOCKET_URL=https://api.seudominio.com
   GOOGLE_CLIENT_ID=...
   TURNSTILE_SECRET_KEY=...        # chave secreta do Cloudflare Turnstile
   VITE_TURNSTILE_SITE_KEY=...     # chave pública (site key)
   SMTP_HOST=smtp.hostinger.com
   SMTP_PORT=465
   SMTP_USER=no-reply@seudominio.com
   SMTP_PASSWORD=...
   SMTP_FROM=Tech4um <no-reply@seudominio.com>
   ```
4. **Suba tudo:**
   ```bash
   docker compose up -d --build
   ```
5. **Coloque um reverse proxy com HTTPS na frente** (Nginx Proxy Manager, Traefik ou Caddy) apontando seu domínio para as portas `5173` (frontend) e `3333` (backend). HTTPS é **obrigatório** — os cookies de sessão usam `Secure` em produção e só trafegam sob TLS.
6. **Configure os serviços externos:**
   - Google Cloud Console: adicione `https://seudominio.com` em *Authorized JavaScript origins*.
   - Cloudflare Turnstile: adicione seu domínio na configuração do widget.
   - E-mail: crie a caixa `no-reply@seudominio.com` no painel da Hostinger e use as credenciais SMTP dela.

> **Importante sobre o banco:** em produção `synchronize` fica desligado. Rode as migrations com `docker compose exec backend npm run migration:run` (gere-as antes em dev com `npm run migration:generate`).

### Deploy gerenciado (alternativa)
- **Backend + Postgres + Redis:** Railway/Render usando `apps/backend/Dockerfile`.
- **Frontend:** Vercel/Netlify (build estático) ou `apps/frontend/Dockerfile` (Nginx).


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

### Implementado nesta rodada (antes listado como limitação)
- **CAPTCHA anti-bot** — Cloudflare Turnstile no cadastro e login (widget no frontend, verificação do token via `siteverify` no backend). Escolhido por ser gratuito, self-hosted-friendly e não exigir conta Google.
- **Verificação de e-mail** — no cadastro é enviado um link (token aleatório de 32 bytes, do qual guardamos apenas o hash SHA-256, com expiração de 24h) via SMTP/`nodemailer`. Criar fórum exige e-mail verificado. Há reenvio de link com resposta genérica anti-enumeração.
- **Blacklist de tokens distribuída** — migrada de memória para **Redis** com TTL igual ao tempo restante do token. Um logout agora se propaga entre todas as instâncias do backend.
- **MFA (2FA via TOTP)** — compatível com Google Authenticator/Authy/1Password. O segredo é criptografado em repouso (AES-256-GCM via `ENCRYPTION_KEY`), o setup exige confirmação de um código válido antes de ativar, e o login passa a ter uma segunda etapa (`/auth/mfa/verify`) com token intermediário de 5 min.

### Limitações que permanecem
- **Recovery codes de MFA** — hoje, se o usuário perder o dispositivo autenticador, a recuperação precisa ser manual (suporte). Um conjunto de códigos de backup seria o próximo passo.
- **Verificação de e-mail não é obrigatória para login** — apenas para ações sensíveis (criar fórum). Decisão de produto para não travar o acesso por um e-mail que pode não ter chegado.
- **WAF / proteção de borda** — fica a cargo da infraestrutura (ex.: Cloudflare na frente do VPS).

## Autenticação

- Login/cadastro com e-mail e senha (hash com bcrypt, política de senha forte)
- Login social com Google (Google Identity Services no frontend + verificação do `idToken` com `google-auth-library` no backend)
- Usuários criados via Google não possuem senha até que decidam definir uma (campo `passwordHash` é opcional na entidade `User`)
- Sessão via cookie `httpOnly` (não acessível via JavaScript) com revogação real no logout

