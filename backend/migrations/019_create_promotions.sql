-- 019_create_promotions.sql
-- Crear tablas para el sistema de promociones y reglas de descuento

-- ─── Tipos enum ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE promotion_type AS ENUM ('percentage', 'fixed', 'bogo');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── Tabla promotions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promotions (
  id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
  name                VARCHAR(255)    NOT NULL,
  description         TEXT,
  type                promotion_type  NOT NULL,
  value               NUMERIC(12, 2)  NOT NULL CHECK (value >= 0),
  start_date          TIMESTAMPTZ     NOT NULL,
  end_date            TIMESTAMPTZ     NOT NULL,
  min_purchase_amount NUMERIC(12, 2)  CHECK (min_purchase_amount >= 0),
  max_discount        NUMERIC(12, 2)  CHECK (max_discount >= 0),
  is_active           BOOLEAN         NOT NULL DEFAULT true,
  priority            INTEGER         NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT promotions_pkey PRIMARY KEY (id),
  CONSTRAINT promotions_dates_check CHECK (end_date > start_date)
);

-- ─── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates     ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_priority  ON promotions(priority);

-- ─── Trigger: actualizar updated_at automáticamente ──────────────────────────
DROP TRIGGER IF EXISTS trg_promotions_updated_at ON promotions;
CREATE TRIGGER trg_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Tabla promotion_rules ────────────────────────────────────────────────────
-- Vincula una promoción con productos específicos o categorías enteras.
-- Si se vincula a una categoría, aplica a TODOS sus productos.
CREATE TABLE IF NOT EXISTS promotion_rules (
  id             UUID         NOT NULL DEFAULT gen_random_uuid(),
  promotion_id   UUID         NOT NULL,
  product_id     UUID,
  category_id    UUID,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT promotion_rules_pkey PRIMARY KEY (id),
  CONSTRAINT promotion_rules_promotion_fk FOREIGN KEY (promotion_id)
    REFERENCES promotions (id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT promotion_rules_product_fk FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT promotion_rules_category_fk FOREIGN KEY (category_id)
    REFERENCES categories (id) ON DELETE CASCADE ON UPDATE NO ACTION,
  -- Al menos uno de product_id o category_id debe estar definido
  CONSTRAINT promotion_rules_target_check CHECK (
    product_id IS NOT NULL OR category_id IS NOT NULL
  ),
  -- No duplicar la misma combinación
  CONSTRAINT promotion_rules_unique UNIQUE (promotion_id, product_id, category_id)
);

-- ─── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_promotion_rules_promotion_id ON promotion_rules(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_rules_product_id   ON promotion_rules(product_id);
CREATE INDEX IF NOT EXISTS idx_promotion_rules_category_id  ON promotion_rules(category_id);

-- ─── Trigger: actualizar updated_at automáticamente ──────────────────────────
DROP TRIGGER IF EXISTS trg_promotion_rules_updated_at ON promotion_rules;
CREATE TRIGGER trg_promotion_rules_updated_at
  BEFORE UPDATE ON promotion_rules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- ROLLBACK (ejecutar manualmente si se necesita revertir):
--   DROP TRIGGER IF EXISTS trg_promotion_rules_updated_at ON promotion_rules;
--   DROP TRIGGER IF EXISTS trg_promotions_updated_at ON promotions;
--   DROP TABLE IF EXISTS promotion_rules;
--   DROP TABLE IF EXISTS promotions;
--   DROP TYPE IF EXISTS promotion_type;
-- =============================================================================
