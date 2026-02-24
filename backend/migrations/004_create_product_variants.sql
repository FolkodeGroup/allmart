-- =============================================================================
-- Migration: 004_create_product_variants
-- Tabla de grupos de variantes de productos (ej: Color, Talle)
-- Ejecutar con: npm run migrate
-- Revertir con: npm run migrate:down (aplica sección ROLLBACK manual)
-- =============================================================================

-- ─── UP ───────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_variants (
  id          UUID         NOT NULL DEFAULT gen_random_uuid(),
  product_id  UUID         NOT NULL,
  name        VARCHAR(100) NOT NULL, -- Ej: "Color", "Talle"
  values      JSONB        NOT NULL DEFAULT '[]', -- Array de strings
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_product_fk FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_name       ON product_variants (name);

-- Trigger: actualizar updated_at automáticamente
-- Reutiliza la función set_updated_at() de migraciones previas
DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON product_variants;
CREATE TRIGGER trg_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- ROLLBACK (ejecutar manualmente si se necesita revertir):
--   DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON product_variants;
--   DROP TABLE IF EXISTS product_variants;
-- =============================================================================
