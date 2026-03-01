# =============================================================================
# Allmart Backend — Dockerfile (multi-stage)
# Imagen Node 20 Alpine para build y producción.
# =============================================================================

# ── Stage 1: Instalación de dependencias ─────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copiar solo los archivos de dependencia para aprovechar cache de Docker
COPY package.json package-lock.json* ./

# Instalar TODAS las dependencias (incluyendo devDeps para build)
RUN npm ci

# ── Stage 2: Build de TypeScript + Prisma ────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias del stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Compilar TypeScript
RUN npm run build

# ── Stage 3: Imagen de producción ────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Crear usuario no-root por seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar package.json para referencia
COPY package.json package-lock.json* ./

# Instalar solo dependencias de producción + dotenv (requerido en runtime por index.ts)
RUN npm ci --omit=dev && npm install dotenv

# Copiar Prisma schema (necesario para el client en runtime)
COPY prisma ./prisma

# Regenerar Prisma Client en la imagen de producción
RUN npx prisma generate

# Copiar el código compilado desde el builder
COPY --from=builder /app/dist ./dist

# Copiar migraciones SQL (para ejecutar desde Docker)
COPY migrations ./migrations

# Copiar scripts de base de datos
COPY scripts ./scripts

# Copiar entrypoint script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Cambiar al usuario no-root
USER appuser

# Puerto expuesto (configurable via env)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Entrypoint: ejecuta migraciones y luego arranca el servidor
ENTRYPOINT ["./docker-entrypoint.sh"]
