-- =============================================================================
-- Migration: 024_update_collections_hybrid
-- Agrega soporte híbrido a colecciones: tipo manual o auto (por ventas).
-- Campos nuevos:
--   type        VARCHAR(20) — 'manual' | 'auto_sales'
--   params      JSONB       — configuración para auto (categoryId, windowDays, limit, ...)
--   snapshot_at TIMESTAMPTZ — última vez que se recalcularon los ítems automáticos
-- =============================================================================

-- 1. Agregar columna type con default 'manual'
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'manual';

-- 2. Agregar columna params (JSONB) para configuración de colecciones auto
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS params JSONB NOT NULL DEFAULT '{}';

-- 3. Agregar columna snapshot_at (puede ser NULL si nunca se sincronizó)
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS snapshot_at TIMESTAMPTZ;

-- 4. Constraint CHECK para validar los valores de type
ALTER TABLE collections
  DROP CONSTRAINT IF EXISTS collections_type_check;
ALTER TABLE collections
  ADD CONSTRAINT collections_type_check
    CHECK (type IN ('manual', 'auto_sales'));

-- 5. Índice para consultas rápidas por tipo
CREATE INDEX IF NOT EXISTS idx_collections_type ON collections (type);

-- 6. Índice para colecciones activas en home (consulta más frecuente del front)
CREATE INDEX IF NOT EXISTS idx_collections_active_home
  ON collections (display_position, display_order)
  WHERE is_active = TRUE;

-- =============================================================================
-- Nota: La columna collection_items.position ya existe.
-- Para colecciones auto, el job sobreescribirá los CollectionItems con el
-- ranking calculado por ventas. Para colecciones manuales sigue igual.
-- =============================================================================
