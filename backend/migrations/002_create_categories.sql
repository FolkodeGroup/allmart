-- =============================================================================
-- Migration: 002_create_categories
-- Tabla de categorías de productos (cocina, baño, mate y café, etc.)
-- Ejecutar con: npm run migrate
-- Revertir con: npm run migrate:down (aplica sección ROLLBACK manual)
-- =============================================================================

-- ─── UP ───────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id          UUID          NOT NULL DEFAULT gen_random_uuid(),
  name        VARCHAR(150)  NOT NULL,
  slug        VARCHAR(150)  NOT NULL,
  description TEXT,
  image_url   TEXT,
  item_count  INTEGER       NOT NULL DEFAULT 0 CHECK (item_count >= 0),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT categories_pkey        PRIMARY KEY (id),
  CONSTRAINT categories_slug_unique UNIQUE (slug)
);

-- ─── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);

-- ─── Trigger: actualizar updated_at automáticamente ──────────────────────────
-- La función set_updated_at() ya fue creada en 001_create_users.sql.
-- Se reutiliza aquí.
DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Trigger: recalcular item_count desde products (preparado) ────────────────
-- Cuando se implemente la tabla products, el siguiente trigger
-- mantendrá item_count sincronizado automáticamente.
-- Se registra aquí como referencia para la migración de products.
--
-- CREATE OR REPLACE FUNCTION sync_category_item_count()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   UPDATE categories
--   SET    item_count = (
--     SELECT COUNT(*) FROM products
--     WHERE  category_id = COALESCE(NEW.category_id, OLD.category_id)
--       AND  status = 'active'
--   )
--   WHERE id = COALESCE(NEW.category_id, OLD.category_id);
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- =============================================================================
-- ROLLBACK (ejecutar manualmente si se necesita revertir):
--   DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
--   DROP TABLE IF EXISTS categories;
-- =============================================================================
