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

## Desenvolvimento local (recomendado)

Fluxo híbrido profissional: **Postgres + Redis no Docker** (dados persistentes) e **app local** com hot reload.

### Pré-requisitos

- Node.js 20+
- pnpm (`npm i -g pnpm`)
- Docker + Docker Compose

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Preencha `apps/backend/.env` e `apps/frontend/.env` (Google OAuth, reCAPTCHA, SMTP etc.).

> `DB_PASSWORD` e `REDIS_PASSWORD` na raiz (`.env`) devem bater com `apps/backend/.env`.

### 3. Subir tudo com um comando

```bash
pnpm dev
```

Isso executa, nesta ordem:

1. **Postgres** em `localhost:5433` (volume `tech4um_postgres_data`)
2. **Redis** em `localhost:6379` (com senha; volume `tech4um_redis_data`)
3. **Frontend** em http://localhost:5173
4. **Backend** em http://localhost:3333

O TypeORM cria as tabelas automaticamente em desenvolvimento (`synchronize: true`).

Na **primeira execução** com banco vazio, o backend cria automaticamente **15 salas de tecnologia** e um usuário demo (sem precisar de login prévio). O dashboard já abre populado.

Para **entrar no chat** de uma sala, faça login com a conta demo (ou cadastre a sua):

| Campo | Valor |
|-------|-------|
| E-mail | `demo@tech4um.local` |
| Senha | `Demo1234!` |

> Listar salas no dashboard é público; login só é exigido para entrar no chat, enviar mensagens ou criar fórum.

Desative o seed automático com `SEED_DEMO_DATA=false` em `apps/backend/.env`.

### Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Infra Docker + app |
| `pnpm dev:app` | Só frontend/backend (infra já rodando) |
| `pnpm dev:infra` | Só Postgres + Redis |
| `pnpm dev:infra:down` | Para Postgres + Redis |
| `pnpm seed` | Recria 15 salas de tecnologia (apaga salas existentes; útil após testes) |
| `pnpm db:shell` | Abre `psql` no Postgres do container |
| `pnpm db:logs` | Logs de Postgres e Redis |

> **Persistência:** nunca rode `docker compose down -v` — o flag `-v` **apaga** os volumes e todo o banco.

### Login com Google

1. Crie um OAuth Client ID (tipo "Web application") em https://console.cloud.google.com/apis/credentials
2. Adicione `http://localhost:5173` em "Authorized JavaScript origins"
3. Copie o Client ID para `GOOGLE_CLIENT_ID` (backend) e `VITE_GOOGLE_CLIENT_ID` (frontend)

## Stack completa com Docker (produção / demo)

```bash
# .env na raiz com JWT_SECRET, ENCRYPTION_KEY, DB_PASSWORD, REDIS_PASSWORD, etc.
docker compose up -d --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3333
- Postgres e Redis **sem portas expostas** na rede interna do compose

## Como rodar localmente sem Docker (legado)

<details>
<summary>Clique para expandir — não recomendado para o time</summary>

### Pré-requisitos adicionais

- PostgreSQL e Redis instalados na máquina

### Passos

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
createdb tech4um
pnpm dev:app
```

</details>

## Build de produção
```bash
pnpm build
```

## Design

O frontend foi implementado a partir do protótipo oficial no Figma, extraindo cores, tipografia (Poppins/Roboto), espaçamentos e componentes diretamente via Figma MCP, garantindo fidelidade visual ao design.

## Testes automatizados

```bash
# Backend (Jest) — controllers, services, utils
pnpm --filter @tech4um/backend test

# Frontend (Vitest) — componentes e utils
pnpm --filter @tech4um/frontend test

# Ou os dois em paralelo via Turborepo
pnpm test
```

## Deploy

Stack de produção isolada (`docker-compose.prod.yml`) + CI/CD via GitHub Actions.

**Guia completo:** [deploy/HOSTINGER.md](deploy/HOSTINGER.md)

### Resumo rápido

1. Na VPS: clone em `/opt/tech4um`, copie `.env.production.example` → `.env`
2. `./deploy/remote-deploy.sh` (primeiro deploy manual)
3. Nginx no host → `127.0.0.1:8173` (front) e `8174` (API + WebSocket)
4. GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`
5. Push na `main` → CI passa → deploy automático

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
- **CAPTCHA anti-bot** — Google reCAPTCHA v3 no cadastro e login (token invisível no frontend, verificação via `siteverify` no backend).
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

