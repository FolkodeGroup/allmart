#!/bin/sh
# =============================================================================
# Allmart Backend — Docker entrypoint
# Ejecuta las migraciones de Prisma y luego arranca el servidor.
# =============================================================================

set -e

echo "[Docker] Esperando a que PostgreSQL esté disponible..."

# Esperar a que PostgreSQL acepte conexiones
until node -e "
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  pool.query('SELECT 1')
    .then(() => { pool.end(); process.exit(0); })
    .catch(() => { pool.end(); process.exit(1); });
" 2>/dev/null; do
  echo "[Docker] PostgreSQL aún no está listo — reintentando en 2s..."
  sleep 2
done

echo "[Docker] PostgreSQL disponible. Ejecutando migraciones de Prisma..."

# Ejecutar migraciones nativas de Prisma para entornos de producción
npx prisma migrate deploy

echo "[Docker] Migraciones de Prisma completadas."

# ⚠️  COMENTADO: No ejecutar seed automáticamente
# El seed regeneraba categorías cada vez que se reiniciaba el contenedor
# Las categorías deben crearse y mantenerse manualmente en el admin panel
# Si necesitas datos de demostración completos, ejecuta manualmente:
#   docker exec allmart-backend npm run seed:demo

# if [ -n "$SEED_ADMIN_PASSWORD" ] && [ -n "$SEED_EDITOR_PASSWORD" ]; then
#   npm run seed:prod
# else
#   echo "[Docker] No se detectaron contraseñas de SEED. Saltando paso."
# fi

echo "[Docker] Arrancando servidor..."

# Arrancar el servidor
exec node dist/index.js