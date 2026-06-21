# Deploy Tech4um na Hostinger (VPS) + GitHub Actions

Guia para rodar o Tech4um **ao lado de outras apps** na mesma VPS, com CI/CD automático no push da `main`.

## Arquitetura

```
Internet → NPM (host, :443) → 172.17.0.1:8173 (frontend Docker)
                                    ├─ /        → React estático
                                    ├─ /api     → proxy interno → backend:3333
                                    └─ /socket.io → proxy interno → backend:3333
         Postgres/Redis só na rede interna Docker (tech4um_internal)
```

O frontend Docker faz proxy de `/api` e `/socket.io` para o backend — **no NPM basta um Proxy Host** (sem Custom Locations).

Portas **8173/8174** são padrão — não conflitam com 80, 443, 5432, 6379 etc.

---

## 1. Setup inicial na VPS (uma vez)

### 1.1 SSH na VPS

```bash
ssh root@SEU_IP
```

### 1.2 Docker (se ainda não tiver)

```bash
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER
# reconecte o SSH
```

### 1.3 Clone do projeto

```bash
sudo mkdir -p /opt/tech4um
sudo chown $USER:$USER /opt/tech4um
git clone https://github.com/SEU_USUARIO/tech4um.git /opt/tech4um
cd /opt/tech4um
```

### 1.4 Arquivo `.env` de produção

```bash
cp .env.production.example .env
nano .env
```

Preencha **todos** os campos. Gere segredos:

```bash
openssl rand -hex 32   # JWT_SECRET
openssl rand -hex 32   # ENCRYPTION_KEY
openssl rand -hex 16   # DB_PASSWORD
openssl rand -hex 16   # REDIS_PASSWORD
```

**Importante no primeiro deploy:**

- `TYPEORM_SYNC_ONCE=true` — cria as tabelas (remova ou `false` após o 1º deploy OK)
- `SEED_DEMO_DATA=true` — opcional, popula 15 salas demo

URLs (exemplo com subdomínio):

```env
CORS_ORIGIN=https://tech4um.seudominio.com
FRONTEND_URL=https://tech4um.seudominio.com
VITE_API_URL=https://tech4um.seudominio.com/api
VITE_SOCKET_URL=https://tech4um.seudominio.com
```

### 1.5 Primeiro deploy manual

```bash
chmod +x deploy/remote-deploy.sh
./deploy/remote-deploy.sh
```

Verifique:

```bash
curl -s http://127.0.0.1:8174/api/forums | head
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8173/
```

### 1.6 Nginx + HTTPS no host

Se já usa **Nginx Proxy Manager** para outras apps, crie **um** Proxy Host:

| Campo | Valor |
|-------|--------|
| Domain | `tech4um.seudominio.com` |
| Forward | `172.17.0.1:8173` |
| Websockets Support | ✅ ligado |
| Custom Locations | **nenhuma** (o frontend repassa `/api` e `/socket.io`) |

SSL: **Certificates** → Let's Encrypt via HTTP → associar no host → Force SSL.

Com Nginx nativo:

```bash
sudo cp deploy/nginx-tech4um.conf.example /etc/nginx/sites-available/tech4um
sudo nano /etc/nginx/sites-available/tech4um   # ajuste server_name
sudo ln -s /etc/nginx/sites-available/tech4um /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d tech4um.seudominio.com
```

### 1.7 Serviços externos

| Serviço | O que configurar |
|---------|------------------|
| **Google OAuth** | Origem JS: `https://tech4um.seudominio.com` |
| **reCAPTCHA v3** | Domínio: `tech4um.seudominio.com` |
| **SMTP Hostinger** | Caixa `no-reply@...` no painel |
| **DNS** | Registro A `tech4um` → IP da VPS |

### 1.8 Chave SSH para o GitHub Actions

Na **sua máquina local**:

```bash
ssh-keygen -t ed25519 -C "github-tech4um-deploy" -f ~/.ssh/tech4um_deploy -N ""
```

Na **VPS**:

```bash
mkdir -p ~/.ssh
echo "COLE_A_CHAVE_PUBLICA" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Teste:

```bash
ssh -i ~/.ssh/tech4um_deploy usuario@SEU_IP
```

---

## 2. GitHub Actions (CI/CD)

No repositório GitHub: **Settings → Secrets and variables → Actions**

| Secret | Exemplo |
|--------|---------|
| `VPS_HOST` | IP ou domínio da VPS |
| `VPS_USER` | `root` ou usuário com docker |
| `VPS_SSH_KEY` | Conteúdo da chave **privada** (`tech4um_deploy`) |
| `VPS_PORT` | `22` (opcional) |

Fluxo:

1. Push/merge na `main` → roda CI (testes + build)
2. CI OK → SSH na VPS → `git pull` + `docker compose -f docker-compose.prod.yml up -d --build`

Deploy manual: **Actions → Deploy VPS → Run workflow**

---

## 3. Comandos úteis na VPS

```bash
cd /opt/tech4um

# Logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend

# Status
docker compose -f docker-compose.prod.yml ps

# Reiniciar só o backend
docker compose -f docker-compose.prod.yml restart backend

# Parar stack (dados persistem nos volumes)
docker compose -f docker-compose.prod.yml down
```

**Nunca** use `docker compose down -v` em produção — apaga o banco.

---

## 4. Convivência com outras apps

- Stack Docker nomeada `tech4um` (project name isolado)
- Volumes: `tech4um_prod_postgres_data`, `tech4um_prod_redis_data`, `tech4um_prod_uploads`
- Portas só em `127.0.0.1` — outras apps podem usar 80/443 via Nginx
- Se **8173/8174** estiverem ocupadas, mude no `.env`:

```env
TECH4UM_FRONTEND_PORT=9183
TECH4UM_BACKEND_PORT=9184
```

E ajuste o Nginx accordingly.
