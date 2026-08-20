#!/usr/bin/env bash
# =============================================================================
# scripts/vps-maintenance.sh
# Mantenimiento preventivo automatizado para VPS DonWeb (Allmart)
# =============================================================================
set -euo pipefail

echo "====================================================="
echo "Iniciando mantenimiento de VPS Allmart - $(date)"
echo "====================================================="

# 1. Eliminar imágenes Docker huérfanas y contenedores detenidos
echo "[1/4] Purgando imágenes y contenedores Docker huérfanos..."
docker image prune -a -f --filter "until=168h" || true
docker container prune -f || true

# 2. Purgar build cache de Docker usando la nueva sintaxis sin tocar volúmenes de PostgreSQL
echo "[2/4] Limpiando build cache de Docker..."
docker builder prune -f --reserved-space 2GB 2>/dev/null || docker builder prune -f --keep-storage 2GB 2>/dev/null || docker builder prune -f || true

# 3. Truncar logs de contenedores que hayan superado 20MB
echo "[3/4] Truncando archivos de log de contenedores..."
find /var/lib/docker/containers/ -type f -name "*.log" -size +20M -exec truncate -s 0 {} + 2>/dev/null || true

# 4. Limpieza del sistema operativo
echo "[4/4] Limpiando journalctl y caché de paquetes..."
if command -v journalctl >/dev/null 2>&1; then
  journalctl --vacuum-time=7d || true
fi
if command -v apt-get >/dev/null 2>&1; then
  apt-get clean || true
fi

echo "====================================================="
echo "Mantenimiento completado exitosamente."
echo "Estado actual del almacenamiento:"
df -h /
echo "====================================================="