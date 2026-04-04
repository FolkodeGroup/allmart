#!/bin/bash
# Script para iniciar el backend local conectado a la BD en VPS Donweb.
# Verifica y activa el túnel SSH si no está activo.

SCRIPT_DIR="$(dirname "$0")"
BACKEND_PORT="3001"

is_tunnel_active() {
    if ss -tlnp 2>/dev/null | grep -q ":${TUNNEL_PORT}"; then
        return 0
    fi
    if netstat -tlnp 2>/dev/null | grep -q ":${TUNNEL_PORT}"; then
        return 0
    fi
    return 1
}

free_backend_port_if_needed() {
    local pid
    pid="$(lsof -ti tcp:${BACKEND_PORT} 2>/dev/null | head -n 1)"

    if [ -n "${pid}" ]; then
        echo "⚠️  Puerto ${BACKEND_PORT} en uso (PID ${pid}). Cerrando proceso previo..."
        kill -15 "${pid}" 2>/dev/null || true
        sleep 1

        if lsof -ti tcp:${BACKEND_PORT} >/dev/null 2>&1; then
            kill -9 "${pid}" 2>/dev/null || true
        fi
    fi
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
free_backend_port_if_needed
echo "🚀 Iniciando backend..."
cd "${SCRIPT_DIR}/backend" || exit 1
npm run dev
