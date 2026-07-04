-- 1. Asegurar que la extensión de trigramas esté habilitada
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. MOD-1 Solucionado: Modificar tipo de dato Product.rating a Double Precision de forma segura en PostgreSQL
ALTER TABLE "products" ALTER COLUMN "rating" TYPE double precision USING "rating"::double precision;

-- 3. CRIT-1 Solucionado: Crear índices GIN de trigrama de forma CONCURRENTE para evitar bloqueos del catálogo en producción
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_name_trgm" ON "products" USING gin ("name" gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_description_trgm" ON "products" USING gin ("description" gin_trgm_ops);

-- 4. CRIT-2 Solucionado: Saneamiento previo de posibles duplicados en carritos antes de aplicar la restricción física UNIQUE
CREATE OR REPLACE FUNCTION sane_cart_duplicates() RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT cart_id, product_id, product_sku_id, SUM(quantity) as total_qty
        FROM cart_items
        GROUP BY cart_id, product_id, product_sku_id
        HAVING COUNT(*) > 1
    LOOP
        -- Consolidar en un solo registro borrando los duplicados
        DELETE FROM cart_items 
        WHERE cart_id = r.cart_id 
          AND product_id = r.product_id 
          AND (product_sku_id = r.product_sku_id OR (product_sku_id IS NULL AND r.product_sku_id IS NULL));
        
        -- Insertar el registro único consolidado
        INSERT INTO cart_items (id, cart_id, product_id, product_sku_id, quantity, created_at)
        VALUES (uuid_generate_v7(), r.cart_id, r.product_id, r.product_sku_id, r.total_qty, NOW());
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT sane_cart_duplicates();
DROP FUNCTION sane_cart_duplicates();

-- Crear índices de unicidad parciales a prueba de nulos
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "cart_items_unique_product_sku" 
ON "cart_items" ("cart_id", "product_id", "product_sku_id") 
WHERE "product_sku_id" IS NOT NULL;

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "cart_items_unique_product_base" 
ON "cart_items" ("cart_id", "product_id") 
WHERE "product_sku_id" IS NULL;

-- 5. MOD-2 Solucionado: Crear índices de claves foráneas inversas para optimizar los JOINS de PostgreSQL
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cart_items_product_id" ON "cart_items" ("product_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cart_items_sku_id" ON "cart_items" ("product_sku_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_order_items_product_id" ON "order_items" ("product_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_supplier_prices_changed_by" ON "supplier_product_prices" ("changed_by");