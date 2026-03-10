#!/bin/bash
# Script para iniciar el backend local conectado a la BD en VPS Donweb.
# Verifica y activa el túnel SSH si no está activo.

SCRIPT_DIR="$(dirname "$0")"

# ─── Verificar túnel SSH a la BD del VPS ──────────────────────────────────────
TUNNEL_PORT="5435"
if ! ss -tlnp 2>/dev/null | grep -q ":${TUNNEL_PORT}" && ! netstat -tlnp 2>/dev/null | grep -q ":${TUNNEL_PORT}"; then
    echo "🔌 Túnel SSH no detectado. Iniciando túnel hacia la BD del VPS..."
    bash "${SCRIPT_DIR}/start-db-tunnel.sh"
    sleep 2
else
    echo "✅ Túnel SSH ya activo en localhost:${TUNNEL_PORT}"
fi

# ─── Iniciar backend ──────────────────────────────────────────────────────────
echo "🚀 Iniciando backend..."
cd "${SCRIPT_DIR}/backend" || exit 1
npm run dev
