-- =============================================================================
-- Migration: 014_add_is_featured_to_products
-- Agregar campo is_featured a la tabla products para marcar productos destacados
-- =============================================================================

-- ─── UP ───────────────────────────────────────────────────────────────────────
ALTER TABLE products
ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- Índice para búsquedas rápidas de productos destacados
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products (is_featured);

-- =============================================================================
-- ROLLBACK (ejecutar manualmente si se necesita revertir):
--   DROP INDEX IF EXISTS idx_products_is_featured;
--   ALTER TABLE products DROP COLUMN is_featured;
-- =============================================================================
