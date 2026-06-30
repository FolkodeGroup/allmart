-- 1. Habilitar la extensión de trigramas
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Crear índices GIN para búsqueda difusa (Fuzzy Search) en productos
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON products USING GIN (description gin_trgm_ops);

-- 3. Índice compuesto para optimizar las queries del dashboard
CREATE INDEX IF NOT EXISTS idx_orders_created_status_total ON orders (created_at DESC, status, total);