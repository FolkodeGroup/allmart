#!/bin/bash
# Script para iniciar el backend local conectado a la BD en VPS Donweb.
# Verifica y activa el túnel SSH si no está activo.

SCRIPT_DIR="$(dirname "$0")"

is_tunnel_active() {
    if ss -tlnp 2>/dev/null | grep -q ":${TUNNEL_PORT}"; then
        return 0
    fi
    if netstat -tlnp 2>/dev/null | grep -q ":${TUNNEL_PORT}"; then
        return 0
    fi
    return 1
}

# ─── Verificar túnel SSH a la BD del VPS ──────────────────────────────────────
TUNNEL_PORT="5435"
if ! is_tunnel_active; then
    echo "🔌 Túnel SSH no detectado. Iniciando túnel hacia la BD del VPS..."
    if ! bash "${SCRIPT_DIR}/start-db-tunnel.sh"; then
        echo "🛑 No se pudo iniciar el túnel SSH. Backend cancelado."
        exit 1
    fi
    sleep 2
else
    echo "✅ Túnel SSH ya activo en localhost:${TUNNEL_PORT}"
fi

if ! is_tunnel_active; then
    echo "🛑 El puerto localhost:${TUNNEL_PORT} sigue sin estar disponible."
    echo "   Revisá conexión SSH/VPS y reintentá."
    exit 1
fi

# ─── Iniciar backend ──────────────────────────────────────────────────────────
echo "🚀 Iniciando backend..."
cd "${SCRIPT_DIR}/backend" || exit 1
npm run dev
