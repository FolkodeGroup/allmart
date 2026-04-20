-- =============================================================================
-- Migration: 011_add_is_active_to_product_variants
-- Agregar campo is_active para gestionar estado activo/inactivo de variantes
-- Ejecutar con: npm run migrate
-- Revertir con: npm run migrate:down (aplica sección ROLLBACK manual)
-- =============================================================================

-- ─── UP ───────────────────────────────────────────────────────────────────────

-- Agregar columna solo si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE product_variants
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;
END
$$;

-- Crear índice para búsquedas frecuentes por estado (si no existe)
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON product_variants (is_active);

-- ─── ROLLBACK ──────────────────────────────────────────────────────────────────

-- DROP INDEX IF EXISTS idx_product_variants_is_active;
-- ALTER TABLE product_variants
-- DROP COLUMN is_active;
