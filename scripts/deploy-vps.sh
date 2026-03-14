#!/bin/bash
# =============================================================================
# Allmart — Script de despliegue en VPS (DonWeb)
#
# Este script se ejecuta en el VPS via SSH desde el pipeline CI/CD.
# También puede ejecutarse manualmente en el VPS.
#
# Requisitos:
#   - Docker instalado en el VPS
#   - Archivo .env configurado en DEPLOY_DIR
#   - Variables de entorno inyectadas por CI/CD o presentes en .env
#
# Uso manual en el VPS:
#   chmod +x scripts/deploy-vps.sh
#   ./scripts/deploy-vps.sh
# =============================================================================

set -euo pipefail

on_error() {
  warn "El despliegue falló. Estado y logs de diagnóstico:"
  docker compose -f "$COMPOSE_FILE" ps || true
  docker compose -f "$COMPOSE_FILE" logs --tail=200 db backend frontend || true
}
trap on_error ERR

# ─── Configuración ────────────────────────────────────────────────────────────
DEPLOY_DIR="/opt/allmart"
COMPOSE_FILE="docker-compose.prod.yml"
BACKEND_IMAGE="dgimenezdeveloper/allmart-backend"
FRONTEND_IMAGE="dgimenezdeveloper/allmart-frontend"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# ─── Colores para output ──────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()    { echo -e "${BLUE}[DEPLOY]${NC} $1"; }
success(){ echo -e "${GREEN}[OK]${NC} $1"; }
warn()   { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ─── Verificar que existe el directorio de deploy ─────────────────────────────
if [ ! -d "$DEPLOY_DIR" ]; then
  log "Creando directorio de despliegue: $DEPLOY_DIR"
  mkdir -p "$DEPLOY_DIR"
fi

cd "$DEPLOY_DIR"
log "Eliminando contenedor allmart-prod-db si existe..."
if docker ps -a --format '{{.Names}}' | grep -q '^allmart-prod-db$'; then
  docker rm -f allmart-prod-db || warn "No se pudo eliminar el contenedor allmart-prod-db"
fi

log "Eliminando red allmart_allmart-prod-network si existe..."
if docker network ls --format '{{.Name}}' | grep -q '^allmart_allmart-prod-network$'; then
  docker network rm allmart_allmart-prod-network || warn "No se pudo eliminar la red allmart_allmart-prod-network"
fi

update_env() {
  key=$1
  value=$(printf '%s' "$2" | tr -d '\r' | tr '\n' ' ' | sed 's/[[:space:]]*$//')
  grep -v "^${key}=" .env > .env.tmp || true
  printf '%s\n' "${key}=${value}" >> .env.tmp
  mv .env.tmp .env
}

# ─── Verificar que existe el .env ─────────────────────────────────────────────
if [ ! -f ".env" ]; then
  error "No se encontró .env en $DEPLOY_DIR. Crea uno a partir de .env.vps.example"
fi

# No construir DATABASE_URL en host VPS: backend usa DB_* directamente via Prisma adapter

# ─── Verificar que existe docker-compose.prod.yml ─────────────────────────────
if [ ! -f "$COMPOSE_FILE" ]; then
  error "No se encontró $COMPOSE_FILE en $DEPLOY_DIR"
fi

# ─── Pull de imágenes desde DockerHub ─────────────────────────────────────────
log "Descargando imágenes desde DockerHub (tag: $IMAGE_TAG)..."
docker pull "${BACKEND_IMAGE}:${IMAGE_TAG}" || error "No se pudo descargar la imagen del backend"
docker pull "${FRONTEND_IMAGE}:${IMAGE_TAG}" || error "No se pudo descargar la imagen del frontend"
success "Imágenes descargadas correctamente"

# ─── Detener contenedores viejos (sin eliminar volúmenes) ─────────────────────
log "Deteniendo contenedores anteriores (si existen)..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans || warn "No había contenedores en ejecución"

# ─── Levantar los nuevos contenedores ─────────────────────────────────────────
log "Levantando contenedores de producción..."
docker compose -f "$COMPOSE_FILE" up -d --wait --wait-timeout 240

# ─── Verificar que los contenedores están corriendo ───────────────────────────
log "Esperando que los servicios estén listos (30s)..."
sleep 30

RUNNING=$(docker compose -f "$COMPOSE_FILE" ps --status running --quiet | wc -l)
if [ "$RUNNING" -lt 3 ]; then
  warn "No todos los contenedores están corriendo. Estado actual:"
  docker compose -f "$COMPOSE_FILE" ps
else
  success "Todos los contenedores están en ejecución ($RUNNING/3)"
fi

# ─── Limpiar imágenes antiguas (no usadas) ────────────────────────────────────
log "Limpiando imágenes Docker no utilizadas..."
docker image prune -f --filter "until=24h" || warn "No se pudieron limpiar imágenes antiguas"

# ─── Estado final ─────────────────────────────────────────────────────────────
echo ""
success "=== Despliegue completado ==="
echo ""
log "Estado de los contenedores:"
docker compose -f "$COMPOSE_FILE" ps
echo ""
log "Logs recientes del backend (últimas 20 líneas):"
docker compose -f "$COMPOSE_FILE" logs --tail=20 backend || true
