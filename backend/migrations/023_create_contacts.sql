-- =============================================================================
-- Migration: 023_create_contacts
-- Tabla para almacenar mensajes de contacto del formulario public en el Home
-- =============================================================================

-- ─── Tabla contacts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id            UUID          NOT NULL DEFAULT gen_random_uuid(),
  name          VARCHAR(150)  NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  phone         VARCHAR(30),
  message       TEXT          NOT NULL,
  status        VARCHAR(50)   NOT NULL DEFAULT 'unread',
  is_flagged    BOOLEAN       NOT NULL DEFAULT FALSE,
  admin_notes   TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT contacts_pkey PRIMARY KEY (id)
);

-- ─── Índice en email para búsquedas ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (email);

-- ─── Índice en status para filtros ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts (status);

-- ─── Índice en created_at para ordenamiento ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts (created_at DESC);

-- ─── Índice en is_flagged para filtros rápidos ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contacts_is_flagged ON contacts (is_flagged);

-- ─── Trigger: actualizar updated_at automáticamente ──────────────────────────
DROP TRIGGER IF EXISTS trg_contacts_updated_at ON contacts;
CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
