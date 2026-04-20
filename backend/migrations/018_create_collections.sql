-- 018_create_collections.sql
-- Crear tablas para colecciones de productos y sus items

-- ─── Tipo enum para posición de visualización ────────────────────────────────
DO $$ BEGIN
  CREATE TYPE collection_display_position AS ENUM ('home', 'category');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── Tabla collections ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collections (
  id                UUID                        NOT NULL DEFAULT gen_random_uuid(),
  name              VARCHAR(255)                NOT NULL,
  slug              VARCHAR(255)                NOT NULL,
  description       TEXT,
  display_order     INTEGER                     NOT NULL DEFAULT 0,
  display_position  collection_display_position NOT NULL,
  image_url         TEXT,
  is_active         BOOLEAN                     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),

  CONSTRAINT collections_pkey        PRIMARY KEY (id),
  CONSTRAINT collections_slug_unique UNIQUE (slug)
);

-- ─── Índices para queries frecuentes ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_collections_slug            ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_is_active       ON collections(is_active);
CREATE INDEX IF NOT EXISTS idx_collections_display_position ON collections(display_position);

-- ─── Trigger: actualizar updated_at automáticamente ──────────────────────────
DROP TRIGGER IF EXISTS trg_collections_updated_at ON collections;
CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Tabla collection_items ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collection_items (
  id             UUID         NOT NULL DEFAULT gen_random_uuid(),
  collection_id  UUID         NOT NULL,
  product_id     UUID         NOT NULL,
  position       INTEGER      NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT collection_items_pkey PRIMARY KEY (id),
  CONSTRAINT collection_items_collection_fk FOREIGN KEY (collection_id)
    REFERENCES collections (id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT collection_items_product_fk FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT collection_items_unique UNIQUE (collection_id, product_id)
);

-- ─── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_product_id    ON collection_items(product_id);
