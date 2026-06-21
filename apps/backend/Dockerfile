# Build context = RAIZ do monorepo (ver docker-compose.yml), pois o backend
# depende do workspace @tech4um/shared, que vive fora de apps/backend.
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- deps: instala todas as dependências do workspace ----
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile

# ---- build: compila shared + backend ----
FROM deps AS build
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
RUN pnpm --filter @tech4um/shared build \
 && pnpm --filter @tech4um/backend build

# ---- runner: imagem final enxuta ----
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/package.json ./apps/backend/
COPY --from=build /app/apps/backend/assets ./apps/backend/assets

WORKDIR /app/apps/backend
RUN mkdir -p uploads
EXPOSE 3333
CMD ["node", "dist/server.js"]
