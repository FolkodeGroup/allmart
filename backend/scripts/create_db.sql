-- =============================================================================
-- Allmart — Script de creación de base de datos
-- En Linux con peer auth ejecutar como:
--   sudo -u postgres psql -f scripts/create_db.sql
-- En entornos con auth TCP habilitado:
--   PGPASSWORD=tu_password psql -h localhost -U postgres -f scripts/create_db.sql
-- =============================================================================

-- Crear la base de datos si no existe
SELECT 'CREATE DATABASE allmart_db'
  WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'allmart_db'
  )\gexec

-- Conectar a la base de datos recién creada
\connect allmart_db

-- Extensiones recomendadas para un ERP escalable
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- Generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- Funciones criptográficas

-- El superusuario postgres ya tiene todos los privilegios.
-- No se crea un rol adicional para evitar conflictos con otros proyectos.

\echo '✅  Base de datos allmart_db lista.'
