-- =============================================================================
-- Allmart — Script de eliminación de base de datos (SOLO testing / reset)
-- ⚠️  PELIGRO: elimina TODOS los datos de allmart_db.
-- En Linux con peer auth ejecutar como:
--   sudo -u postgres psql -f scripts/drop_db.sql
-- =============================================================================

-- Cerrar conexiones activas antes de eliminar
SELECT pg_terminate_backend(pid)
FROM   pg_stat_activity
WHERE  datname = 'allmart_db'
  AND  pid <> pg_backend_pid();

DROP DATABASE IF EXISTS allmart_db;

\echo '🗑️   Base de datos allmart_db eliminada.'
