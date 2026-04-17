#!/usr/bin/env bash
# =============================================================================
# Allmart — Túnel SSH hacia la base de datos PostgreSQL del VPS Donweb
#
# Crea un túnel SSH que reenvía el puerto LOCAL 5435 al puerto 5434 del VPS,
# el cual internamente apunta al contenedor PostgreSQL en el puerto 5432.
#
# Uso:
#   chmod +x start-db-tunnel.sh
#   ./start-db-tunnel.sh
#
# Requiere:
#   - Acceso SSH al VPS (168.197.49.120:5371)
#   - El backend/.env con DB_HOST=localhost y DB_PORT=5435
# =============================================================================

VPS_HOST="168.197.49.120"
VPS_SSH_PORT="5371"
VPS_DB_PORT="5434"         # Puerto que expone Docker en el VPS
LOCAL_TUNNEL_PORT="5435"   # Puerto local donde escucha el túnel
SSH_USER="root"

is_tunnel_active() {
    if ss -tlnp 2>/dev/null | grep -q ":${LOCAL_TUNNEL_PORT}"; then
        return 0
    fi
    if netstat -tlnp 2>/dev/null | grep -q ":${LOCAL_TUNNEL_PORT}"; then
        return 0
    fi
    return 1
}

# ─── Verificar si ya existe un túnel activo ───────────────────────────────────
EXISTING_PID=$(pgrep -f "ssh.*${LOCAL_TUNNEL_PORT}:localhost:${VPS_DB_PORT}.*${VPS_HOST}")
if [ -n "$EXISTING_PID" ]; then
    echo "⚠️  Ya existe un túnel activo (PID: $EXISTING_PID). Cerrándolo..."
    kill "$EXISTING_PID" 2>/dev/null
    sleep 1
fi

echo "🔐 Iniciando túnel SSH hacia la base de datos del VPS..."
echo "   Local  → localhost:${LOCAL_TUNNEL_PORT}"
echo "   Remoto → ${VPS_HOST}:${VPS_DB_PORT} (PostgreSQL)"
echo ""

# ─── Verificar alcance de red SSH antes de abrir túnel ───────────────────────
if ! timeout 8 bash -c "</dev/tcp/${VPS_HOST}/${VPS_SSH_PORT}" 2>/dev/null; then
    echo "❌ No hay conectividad con ${VPS_HOST}:${VPS_SSH_PORT}."
    echo "   Verificá internet/VPN, firewall o disponibilidad del VPS y reintentá."
    exit 1
fi

# ─── Crear el túnel SSH en background ─────────────────────────────────────────
ssh -f -N \
    -L "${LOCAL_TUNNEL_PORT}:localhost:${VPS_DB_PORT}" \
    -p "${VPS_SSH_PORT}" \
    -o ConnectTimeout=10 \
    -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes \
    "${SSH_USER}@${VPS_HOST}"

if [ $? -eq 0 ] && is_tunnel_active; then
    NEW_PID=$(pgrep -f "ssh.*${LOCAL_TUNNEL_PORT}:localhost:${VPS_DB_PORT}.*${VPS_HOST}" | head -n 1)
    echo "✅ Túnel activo. PID: ${NEW_PID}"
    echo ""
    echo "   Ahora podés iniciar el backend local con:"
    echo "   cd backend && npm run dev"
    echo ""
    echo "   Para cerrar el túnel cuando termines:"
    echo "   kill ${NEW_PID}"
else
    echo "❌ Error al crear el túnel SSH."
    echo "   Revisá acceso SSH con: ssh -p ${VPS_SSH_PORT} ${SSH_USER}@${VPS_HOST}"
    exit 1
fi
