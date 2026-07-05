-- DropIndex
DROP INDEX "cart_items_unique_product";

-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "product_sku_id" UUID;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_sku_fk" FOREIGN KEY ("product_sku_id") REFERENCES "product_skus"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- 1. Habilitar la extensión de trigramas si no existe previamente
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Crear un índice GIN utilizando pg_trgm para la columna 'name' de la tabla 'products'
CREATE INDEX IF NOT EXISTS "idx_products_name_trgm" 
ON "products" 
USING gin ("name" gin_trgm_ops);

-- 3. Crear un índice GIN utilizando pg_trgm para la columna 'description' de la tabla 'products'
CREATE INDEX IF NOT EXISTS "idx_products_description_trgm" 
ON "products" 
USING gin ("description" gin_trgm_ops);

-- 4. Crear un índice GIN utilizando pg_trgm para la columna 'sku' de la tabla 'products' (búsqueda parcial de SKU)
CREATE INDEX IF NOT EXISTS "idx_products_sku_trgm" 
ON "products" 
USING gin ("sku" gin_trgm_ops);