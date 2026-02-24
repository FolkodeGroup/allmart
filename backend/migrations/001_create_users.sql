-- =============================================================================
-- Migration: 001_create_users
-- Tabla de usuarios (clientes y administradores del sistema)
-- Ejecutar con: npm run migrate
-- =============================================================================

-- ─── Tipo enum para roles ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'editor', 'customer');
EXCEPTION
  WHEN duplicate_object THEN NULL; -- Ya existe, ignorar
END $$;

-- ─── Tabla users ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID          NOT NULL DEFAULT gen_random_uuid(),
  first_name    VARCHAR(100)  NOT NULL,
  last_name     VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  password_hash TEXT          NOT NULL,
  role          user_role     NOT NULL DEFAULT 'customer',
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT users_pkey        PRIMARY KEY (id),
  CONSTRAINT users_email_unique UNIQUE (email)
);

-- ─── Índice en email para búsquedas rápidas ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ─── Índice en role para filtros de administración ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- ─── Trigger: actualizar updated_at automáticamente ──────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
