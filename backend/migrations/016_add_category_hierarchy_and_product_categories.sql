-- =============================================================================
-- Migration: 016_add_category_hierarchy_and_product_categories
-- Adds parent_id to categories and a join table for product-category relations.
-- =============================================================================

-- ─── UP ───────────────────────────────────────────────────────────────────────

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_id UUID;

ALTER TABLE categories
  DROP CONSTRAINT IF EXISTS categories_parent_fk;
ALTER TABLE categories
  ADD CONSTRAINT categories_parent_fk FOREIGN KEY (parent_id)
  REFERENCES categories (id) ON DELETE SET NULL;

ALTER TABLE categories
  DROP CONSTRAINT IF EXISTS categories_parent_self_check;
ALTER TABLE categories
  ADD CONSTRAINT categories_parent_self_check CHECK (parent_id IS NULL OR parent_id <> id);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories (parent_id);

CREATE TABLE IF NOT EXISTS product_categories (
  product_id UUID NOT NULL,
  category_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT product_categories_pkey PRIMARY KEY (product_id, category_id),
  CONSTRAINT product_categories_product_fk FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT product_categories_category_fk FOREIGN KEY (category_id)
    REFERENCES categories (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories (product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories (category_id);

-- Backfill existing product-category links
INSERT INTO product_categories (product_id, category_id)
SELECT id, category_id
FROM products
WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ─── Update category item_count triggers for many-to-many ─────────────────────

DROP TRIGGER IF EXISTS trg_products_sync_category_count ON products;
DROP FUNCTION IF EXISTS sync_category_item_count();

CREATE OR REPLACE FUNCTION sync_category_item_count_on_category_link()
RETURNS TRIGGER AS $$
DECLARE
  affected_ids UUID[] := ARRAY[]::uuid[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    affected_ids := ARRAY[NEW.category_id];
  ELSIF TG_OP = 'DELETE' THEN
    affected_ids := ARRAY[OLD.category_id];
  ELSE
    affected_ids := ARRAY[OLD.category_id, NEW.category_id];
  END IF;

  UPDATE categories
  SET item_count = (
    SELECT COUNT(DISTINCT pc.product_id)
    FROM product_categories pc
    JOIN products p ON p.id = pc.product_id
    WHERE pc.category_id = categories.id
      AND p.status = 'active'
  )
  WHERE id = ANY(affected_ids);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_categories_sync_category_count ON product_categories;
CREATE TRIGGER trg_product_categories_sync_category_count
  AFTER INSERT OR UPDATE OR DELETE ON product_categories
  FOR EACH ROW EXECUTE FUNCTION sync_category_item_count_on_category_link();

CREATE OR REPLACE FUNCTION sync_category_item_count_on_product_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE categories
    SET item_count = (
      SELECT COUNT(DISTINCT pc.product_id)
      FROM product_categories pc
      JOIN products p ON p.id = pc.product_id
      WHERE pc.category_id = categories.id
        AND p.status = 'active'
    )
    WHERE id IN (
      SELECT category_id FROM product_categories WHERE product_id = NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_sync_category_count_on_status ON products;
CREATE TRIGGER trg_products_sync_category_count_on_status
  AFTER UPDATE OF status ON products
  FOR EACH ROW EXECUTE FUNCTION sync_category_item_count_on_product_status();

-- =============================================================================
-- ROLLBACK (manual):
--   DROP TRIGGER IF EXISTS trg_product_categories_sync_category_count ON product_categories;
--   DROP FUNCTION IF EXISTS sync_category_item_count_on_category_link();
--   DROP TRIGGER IF EXISTS trg_products_sync_category_count_on_status ON products;
--   DROP FUNCTION IF EXISTS sync_category_item_count_on_product_status();
--   DROP TABLE IF EXISTS product_categories;
--   ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_parent_fk;
--   ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_parent_self_check;
--   ALTER TABLE categories DROP COLUMN IF EXISTS parent_id;
--
--   -- Restore original trigger from 003_create_products.sql
--   CREATE OR REPLACE FUNCTION sync_category_item_count()
--   RETURNS TRIGGER AS $$
--   DECLARE
--     affected_category_id UUID;
--   BEGIN
--     IF TG_OP = 'DELETE' THEN
--       affected_category_id := OLD.category_id;
--     ELSIF TG_OP = 'UPDATE' THEN
--       IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
--         IF OLD.category_id IS NOT NULL THEN
--           UPDATE categories
--           SET item_count = (
--             SELECT COUNT(*) FROM products
--             WHERE category_id = OLD.category_id AND status = 'active'
--           )
--           WHERE id = OLD.category_id;
--         END IF;
--       END IF;
--       affected_category_id := NEW.category_id;
--     ELSE
--       affected_category_id := NEW.category_id;
--     END IF;
--
--     IF affected_category_id IS NOT NULL THEN
--       UPDATE categories
--       SET item_count = (
--         SELECT COUNT(*) FROM products
--         WHERE category_id = affected_category_id AND status = 'active'
--       )
--       WHERE id = affected_category_id;
--     END IF;
--
--     IF TG_OP = 'DELETE' THEN
--       RETURN OLD;
--     END IF;
--     RETURN NEW;
--   END;
--   $$ LANGUAGE plpgsql;
--
--   DROP TRIGGER IF EXISTS trg_products_sync_category_count ON products;
--   CREATE TRIGGER trg_products_sync_category_count
--     AFTER INSERT OR UPDATE OR DELETE ON products
--     FOR EACH ROW EXECUTE FUNCTION sync_category_item_count();
-- =============================================================================
