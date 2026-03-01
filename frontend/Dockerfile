# =============================================================================
# Allmart Frontend — Dockerfile (multi-stage)
# Build con Node 20 Alpine, serve con nginx Alpine.
# =============================================================================

# ── Stage 1: Instalación de dependencias ─────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copiar solo los archivos de dependencia para aprovechar cache de Docker
COPY package.json package-lock.json* ./

# Instalar todas las dependencias
RUN npm ci

# ── Stage 2: Build de React/Vite ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias del stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Argumento para la URL del backend (inyectable en build time)
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL

# Build de producción
RUN npm run build

# ── Stage 3: Servir con nginx ────────────────────────────────────────────────
FROM nginx:stable-alpine AS production

# Eliminar la configuración por defecto de nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar nuestra configuración personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar el build desde el stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Puerto expuesto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# nginx se ejecuta en primer plano
CMD ["nginx", "-g", "daemon off;"]
