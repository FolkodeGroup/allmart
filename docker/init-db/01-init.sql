-- =============================================================================
-- Allmart — Script de inicialización para Docker
-- Este archivo se ejecuta AUTOMÁTICAMENTE cuando el contenedor PostgreSQL
-- arranca por primera vez (docker-entrypoint-initdb.d).
--
-- Habilita las extensiones necesarias para el proyecto.
-- Las tablas se crean a través de las migraciones del backend.
-- =============================================================================

-- Extensiones recomendadas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla de control de migraciones (la crea también migrate.ts, pero la
-- dejamos aquí para que el backend pueda consultar migraciones desde el inicio)
CREATE TABLE IF NOT EXISTS schema_migrations (
  id         SERIAL       PRIMARY KEY,
  filename   VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

\echo '✅  Base de datos allmart_db inicializada para Docker.'
