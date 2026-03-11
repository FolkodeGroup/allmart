-- ──────────────────────────────────────────────────────────────────────────────
-- Migration 010: Sistema de almacenamiento binario de imágenes con WebP
-- ──────────────────────────────────────────────────────────────────────────────
-- Objetivo:
--   Reemplazar el almacenamiento de imágenes como URLs externas (JSONB) por
--   almacenamiento binario (BYTEA) directamente en la base de datos.
--   Cada imagen se convierte a WebP y se genera una miniatura automáticamente.
-- ──────────────────────────────────────────────────────────────────────────────

-- ── Tabla: product_images_storage ────────────────────────────────────────────
-- Almacena imágenes de productos en formato WebP (binario).
-- Cada fila contiene la imagen completa (data) y su miniatura (thumbnail).

CREATE TABLE IF NOT EXISTS product_images_storage (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID         NOT NULL REFERENCES products(id) ON DELETE CASCADE ON UPDATE NO ACTION,

  -- Imagen completa en WebP (max ~1 MB recomendado)
  data              BYTEA        NOT NULL,
  width             INTEGER      NOT NULL,
  height            INTEGER      NOT NULL,

  -- Miniatura en WebP (~200px de ancho, para previews)
  thumbnail         BYTEA,
  thumb_width       INTEGER,
  thumb_height      INTEGER,

  -- Metadatos
  mime_type         VARCHAR(50)  NOT NULL DEFAULT 'image/webp',
  original_filename VARCHAR(255),
  size_bytes        INTEGER      NOT NULL,  -- tamaño del WebP (no del original)
  alt_text          VARCHAR(500),
  position          INTEGER      NOT NULL DEFAULT 0,

  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images_storage(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_position   ON product_images_storage(product_id, position);

-- Comentarios de columna
COMMENT ON TABLE  product_images_storage          IS 'Imágenes de productos almacenadas en binario WebP';
COMMENT ON COLUMN product_images_storage.data      IS 'Imagen completa en WebP (BYTEA)';
COMMENT ON COLUMN product_images_storage.thumbnail IS 'Miniatura WebP ~200px para listas y previews';
COMMENT ON COLUMN product_images_storage.size_bytes IS 'Tamaño en bytes del WebP resultante (no del original)';

-- ── Tabla: category_images_storage ───────────────────────────────────────────
-- Almacena la imagen de cada categoría en formato WebP.

CREATE TABLE IF NOT EXISTS category_images_storage (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id       UUID         NOT NULL REFERENCES categories(id) ON DELETE CASCADE ON UPDATE NO ACTION,

  -- Imagen completa en WebP
  data              BYTEA        NOT NULL,
  width             INTEGER      NOT NULL,
  height            INTEGER      NOT NULL,

  -- Miniatura
  thumbnail         BYTEA,
  thumb_width       INTEGER,
  thumb_height      INTEGER,

  -- Metadatos
  mime_type         VARCHAR(50)  NOT NULL DEFAULT 'image/webp',
  original_filename VARCHAR(255),
  size_bytes        INTEGER      NOT NULL,
  alt_text          VARCHAR(500),

  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_category_images_unique_category ON category_images_storage(category_id);
COMMENT ON TABLE category_images_storage IS 'Imagen de categoría almacenada en binario WebP (una por categoría)';
