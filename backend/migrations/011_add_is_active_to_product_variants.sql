-- =============================================================================
-- Migration: 011_add_is_active_to_product_variants
-- Agregar campo is_active para gestionar estado activo/inactivo de variantes
-- Ejecutar con: npm run migrate
-- Revertir con: npm run migrate:down (aplica sección ROLLBACK manual)
-- =============================================================================

-- ─── UP ───────────────────────────────────────────────────────────────────────

ALTER TABLE product_variants
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Crear índice para búsquedas frecuentes por estado
CREATE INDEX idx_product_variants_is_active ON product_variants (is_active);

-- ─── ROLLBACK ──────────────────────────────────────────────────────────────────

-- DROP INDEX IF EXISTS idx_product_variants_is_active;
-- ALTER TABLE product_variants
-- DROP COLUMN is_active;
