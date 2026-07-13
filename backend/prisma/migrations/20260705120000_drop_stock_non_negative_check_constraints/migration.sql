-- New migration to drop stock non-negative check constraints.
-- This preserves all existing migrations and only removes the two stock constraints.

ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "chk_products_stock_non_negative";
ALTER TABLE "product_skus" DROP CONSTRAINT IF EXISTS "chk_skus_stock_non_negative";
