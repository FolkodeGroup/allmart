-- 020_update_product_reviews_for_order_verification.sql
-- Permite reseñas verificadas por número de pedido (sin cuenta de usuario).

-- 1. Hacer user_id nullable (ya no requerido para reseñas de invitados)
ALTER TABLE product_reviews
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Agregar order_id para verificar que el cliente compró el producto
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- 3. Nombre del reseñador para invitados
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS reviewer_name VARCHAR(100);

-- 4. Índice para búsquedas por pedido
CREATE INDEX IF NOT EXISTS idx_product_reviews_order_id
  ON product_reviews(order_id);

-- 5. Restricción única: un solo review por pedido+producto
-- 5. Restricción única: un solo review por pedido+producto (agregar solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'product_reviews_order_unique') THEN
    ALTER TABLE product_reviews
      ADD CONSTRAINT product_reviews_order_unique
      UNIQUE (product_id, order_id);
  END IF;
END
$$;

-- 6. CHECK: debe haber al menos una identidad (user_id o order_id) (agregar solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_reviews_identity_check') THEN
    ALTER TABLE product_reviews
      ADD CONSTRAINT product_reviews_identity_check
      CHECK (user_id IS NOT NULL OR order_id IS NOT NULL);
  END IF;
END
$$;
