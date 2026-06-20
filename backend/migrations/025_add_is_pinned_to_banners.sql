-- =============================================================================
-- Migration: 025_add_is_pinned_to_banners
-- Agrega la columna is_pinned a la tabla banners para fijar banners prioritarios
-- =============================================================================

-- Agregar columna is_pinned solo si no existe
ALTER TABLE banners ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

-- Crear índice para búsquedas y ordenamientos rápidos por is_pinned
CREATE INDEX IF NOT EXISTS idx_banners_is_pinned ON banners(is_pinned);