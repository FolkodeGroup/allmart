#!/bin/sh
# =============================================================================
# Allmart Backend — Docker entrypoint
# Ejecuta las migraciones SQL pendientes y luego arranca el servidor.
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

echo "[Docker] PostgreSQL disponible. Ejecutando migraciones..."

# Ejecutar migraciones SQL pendientes
node -e "
  const fs = require('fs');
  const path = require('path');
  const { Pool } = require('pg');

  const pool = new Pool({
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  async function run() {
    const client = await pool.connect();
    try {
      // Asegurar tabla de migraciones
      await client.query(\`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      \`);

      // Obtener migraciones ya aplicadas
      const { rows } = await client.query('SELECT filename FROM schema_migrations ORDER BY id ASC');
      const applied = new Set(rows.map(r => r.filename));

      // Leer archivos de migración
      const migrationsDir = path.resolve(__dirname, 'migrations');
      if (!fs.existsSync(migrationsDir)) {
        console.log('[Migrate] No se encontró carpeta de migraciones.');
        return;
      }
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
      const pending = files.filter(f => !applied.has(f));

      if (pending.length === 0) {
        console.log('[Migrate] No hay migraciones pendientes.');
        return;
      }

      for (const file of pending) {
        console.log('  → Aplicando: ' + file);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (filename) VALUES (\$1)', [file]);
          await client.query('COMMIT');
          console.log('  ✅ ' + file);
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        }
      }
      console.log('[Migrate] ' + pending.length + ' migración(es) aplicada(s).');
    } finally {
      client.release();
      await pool.end();
    }
  }

  run().catch(err => { console.error('[Migrate] Error:', err.message); process.exit(1); });
"

echo "[Docker] Migraciones completadas."

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
