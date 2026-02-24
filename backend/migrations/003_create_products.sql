-- =============================================================================
-- Migration: 003_create_products
-- Tabla de productos del catálogo.
-- Refleja la interfaz Product del frontend y el modelo Product del backend.
-- Ejecutar con: npm run migrate
-- Revertir con: npm run migrate:down (aplica sección ROLLBACK manual)
-- =============================================================================

-- ─── UP ───────────────────────────────────────────────────────────────────────

-- ─── Tipo enum para estado del producto ──────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('active', 'inactive', 'draft', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL; -- Ya existe, ignorar
END $$;

-- ─── Tabla products ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                UUID           NOT NULL DEFAULT gen_random_uuid(),
  name              VARCHAR(255)   NOT NULL,
  slug              VARCHAR(255)   NOT NULL,
  description       TEXT,
  short_description TEXT,
  price             NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  original_price    NUMERIC(12, 2)           CHECK (original_price >= 0),
  discount          NUMERIC(5, 2)            CHECK (discount >= 0 AND discount <= 100),
  images            JSONB          NOT NULL DEFAULT '[]',
  category_id       UUID,
  tags              JSONB          NOT NULL DEFAULT '[]',
  rating            NUMERIC(3, 2)  NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count      INTEGER        NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  in_stock          BOOLEAN        NOT NULL DEFAULT TRUE,
  stock             INTEGER        NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku               VARCHAR(100),
  features          JSONB          NOT NULL DEFAULT '[]',
  status            product_status NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT products_pkey        PRIMARY KEY (id),
  CONSTRAINT products_slug_unique UNIQUE (slug),
  CONSTRAINT products_sku_unique  UNIQUE (sku),
  CONSTRAINT products_category_fk FOREIGN KEY (category_id)
    REFERENCES categories (id) ON DELETE SET NULL
);

-- ─── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_slug        ON products (slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_status      ON products (status);
CREATE INDEX IF NOT EXISTS idx_products_sku         ON products (sku);

-- ─── Trigger: actualizar updated_at automáticamente ──────────────────────────
-- La función set_updated_at() ya fue creada en 001_create_users.sql.
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Trigger: sincronizar item_count en categories ───────────────────────────
-- Mantiene categories.item_count actualizado cuando se insertan,
-- actualizan o eliminan productos activos.
CREATE OR REPLACE FUNCTION sync_category_item_count()
RETURNS TRIGGER AS $$
DECLARE
  affected_category_id UUID;
BEGIN
  -- Determinar la categoría afectada según la operación
  IF TG_OP = 'DELETE' THEN
    affected_category_id := OLD.category_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si cambió la categoría, recalcular tanto la antigua como la nueva
    IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
      IF OLD.category_id IS NOT NULL THEN
        UPDATE categories
        SET item_count = (
          SELECT COUNT(*) FROM products
          WHERE category_id = OLD.category_id AND status = 'active'
        )
        WHERE id = OLD.category_id;
      END IF;
    END IF;
    affected_category_id := NEW.category_id;
  ELSE
    -- INSERT
    affected_category_id := NEW.category_id;
  END IF;

  -- Recalcular item_count para la categoría afectada
  IF affected_category_id IS NOT NULL THEN
    UPDATE categories
    SET item_count = (
      SELECT COUNT(*) FROM products
      WHERE category_id = affected_category_id AND status = 'active'
    )
    WHERE id = affected_category_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_sync_category_count ON products;
CREATE TRIGGER trg_products_sync_category_count
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION sync_category_item_count();

-- =============================================================================
-- ROLLBACK (ejecutar manualmente si se necesita revertir):
--   DROP TRIGGER IF EXISTS trg_products_sync_category_count ON products;
--   DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
--   DROP FUNCTION IF EXISTS sync_category_item_count();
--   DROP TABLE IF EXISTS products;
--   DROP TYPE IF EXISTS product_status;
-- =============================================================================
