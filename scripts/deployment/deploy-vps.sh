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

cleanup_project_images() {
  local image_repo="$1"
  local container_name="$2"
  local current_image_ref=""
  local current_image_id=""
  local image_refs=""
  local candidate_image_id=""

  if docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
    current_image_ref=$(docker inspect --format '{{.Config.Image}}' "$container_name" 2>/dev/null || true)
    current_image_id=$(docker inspect --format '{{.Image}}' "$container_name" 2>/dev/null || true)
  fi

  image_refs=$(docker image ls "$image_repo" --format '{{.Repository}}:{{.Tag}}' | sort -u || true)

  if [ -z "$image_refs" ]; then
    log "No hay imágenes locales para limpiar en $image_repo"
    return 0
  fi

  while IFS= read -r line; do
    [ -z "$line" ] && continue

    local image_ref="$line"

    if [ "$image_ref" = "${image_repo}:<none>" ]; then
      continue
    fi

    if [ -n "$current_image_ref" ] && [ "$image_ref" = "$current_image_ref" ]; then
      log "Conservando imagen en uso: $image_ref"
      continue
    fi

    candidate_image_id=$(docker image inspect --format '{{.Id}}' "$image_ref" 2>/dev/null || true)
    if [ -n "$current_image_id" ] && [ "$candidate_image_id" = "$current_image_id" ]; then
      log "Conservando alias de la imagen en uso: $image_ref"
      continue
    fi

    log "Eliminando imagen antigua de Allmart: $image_ref"
    docker image rm "$image_ref" >/dev/null 2>&1 || warn "No se pudo eliminar $image_ref"
  done <<EOF
$image_refs
EOF
}

cleanup_stale_recreate_containers() {
  local container_name="$1"
  local stale_names=""

  stale_names=$(docker ps -a --format '{{.Names}}' | grep -E "^[a-f0-9]{12}_${container_name}$" || true)

  if [ -z "$stale_names" ]; then
    return 0
  fi

  while IFS= read -r stale_name; do
    [ -z "$stale_name" ] && continue
    warn "Eliminando contenedor temporal huérfano de una recreación previa: $stale_name"
    docker rm -f "$stale_name" >/dev/null 2>&1 || warn "No se pudo eliminar $stale_name"
  done <<EOF
$stale_names
EOF
}

cleanup_unhealthy_service_container() {
  local container_name="$1"
  local status=""

  if ! docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
    return 0
  fi

  status=$(docker inspect --format '{{.State.Status}}' "$container_name" 2>/dev/null || true)

  case "$status" in
    dead|removing|created|exited)
      warn "Eliminando contenedor $container_name en estado no reutilizable: $status"
      docker rm -f "$container_name" >/dev/null 2>&1 || warn "No se pudo eliminar $container_name"
      ;;
  esac
}

# ─── Verificar que existe el directorio de deploy ─────────────────────────────
if [ ! -d "$DEPLOY_DIR" ]; then
  log "Creando directorio de despliegue: $DEPLOY_DIR"
  mkdir -p "$DEPLOY_DIR"
fi

cd "$DEPLOY_DIR"

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

# ─── Mantener DB intacta y recrear solo backend/frontend ──────────────────────
log "Asegurando que la base de datos permanezca levantada..."
docker compose -f "$COMPOSE_FILE" up -d db --wait --wait-timeout 180

log "Limpiando residuos de recreaciones previas de backend/frontend..."
cleanup_stale_recreate_containers "allmart-prod-backend"
cleanup_stale_recreate_containers "allmart-prod-frontend"
cleanup_unhealthy_service_container "allmart-prod-backend"
cleanup_unhealthy_service_container "allmart-prod-frontend"

log "Actualizando backend y frontend sin recrear la base de datos..."
docker compose -f "$COMPOSE_FILE" up -d --no-deps --remove-orphans backend frontend --wait --wait-timeout 240

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

# ─── Limpiar solo imágenes antiguas de Allmart ────────────────────────────────
log "Limpiando únicamente imágenes antiguas de Allmart..."
cleanup_project_images "$BACKEND_IMAGE" "allmart-prod-backend"
cleanup_project_images "$FRONTEND_IMAGE" "allmart-prod-frontend"

# ─── Estado final ─────────────────────────────────────────────────────────────
echo ""
success "=== Despliegue completado ==="
echo ""
log "Estado de los contenedores:"
docker compose -f "$COMPOSE_FILE" ps
echo ""
log "Logs recientes del backend (últimas 20 líneas):"
docker compose -f "$COMPOSE_FILE" logs --tail=20 backend || true
