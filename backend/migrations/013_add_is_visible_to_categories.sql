-- 013_add_is_visible_to_categories.sql
-- Agrega el campo is_visible a la tabla categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE;

-- Para revertir:
-- ALTER TABLE categories DROP COLUMN IF EXISTS is_visible;