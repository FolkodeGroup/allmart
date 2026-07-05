# =============================================================================
# Allmart Backend — Dockerfile (multi-stage)
# Imagen Node 22 Debian slim para build y producción.
# =============================================================================

# ── Stage 1: Instalación de dependencias ─────────────────────────────────────
FROM node:22-bookworm-slim AS deps

ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    unzip && \
    rm -rf /var/lib/apt/lists/*

# Copiar solo los archivos de dependencia para aprovechar cache de Docker
COPY package.json package-lock.json* ./

# Instalar TODAS las dependencias (incluyendo devDeps para build)
RUN npm ci --prefer-offline --no-audit && \
    npm cache clean --force

# ── Stage 2: Build de TypeScript + Prisma ────────────────────────────────────
FROM node:22-bookworm-slim AS builder

ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

WORKDIR /app

# Copiar dependencias del stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Compilar TypeScript
RUN npm run build

# ── Stage 3: Imagen de producción ────────────────────────────────────────────
FROM node:22-bookworm-slim AS production

ENV NODE_ENV=production
ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    libxss1 \
    unzip \
    wget && \
    rm -rf /var/lib/apt/lists/*

# Crear usuario no-root por seguridad
RUN groupadd -r appgroup && useradd -r -g appgroup -G audio,video appuser

# Copiar package.json para referencia
COPY package.json package-lock.json* ./

# Instalar solo dependencias de producción + dotenv (requerido en runtime por index.ts)
RUN npm ci --prefer-offline --no-audit --omit=dev && \
    npm install dotenv && \
    npm cache clean --force && \
    rm -rf /home/node/.npm

# Copiar Prisma schema y archivo de configuración (Requerido para Prisma 7)
COPY prisma ./prisma
COPY prisma.config.ts ./

# Regenerar Prisma Client en la imagen de producción
RUN npx prisma generate && \
    npm cache clean --force

# Copiar el código compilado desde el builder
COPY --from=builder /app/dist ./dist

# Copiar scripts de base de datos
COPY scripts ./scripts

# Copiar entrypoint script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && \
    mkdir -p /app/.cache/puppeteer && \
    chown -R appuser:appgroup /app && \
    rm -rf .npmrc .gitignore .git .gitkeep

# Cambiar al usuario no-root
USER appuser

# Puerto expuesto (configurable via env)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Entrypoint: ejecuta migraciones y luego arranca el servidor
ENTRYPOINT ["./docker-entrypoint.sh"]