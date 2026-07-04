-- ============================================================================
-- MIGRACIÓN SQL: RESTRICCIONES "CHECK" DE INTEGRIDAD FÍSICA
-- ============================================================================

-- 1. Restricciones para la tabla de Productos (products)
ALTER TABLE "products" ADD CONSTRAINT "chk_products_price_non_negative" CHECK ("price" >= 0.00);
ALTER TABLE "products" ADD CONSTRAINT "chk_products_stock_non_negative" CHECK ("stock" >= 0);
ALTER TABLE "products" ADD CONSTRAINT "chk_products_rating_range" CHECK ("rating" >= 0.00 AND "rating" <= 5.00);

-- 2. Restricciones para la tabla de SKU de Variantes (product_skus)
ALTER TABLE "product_skus" ADD CONSTRAINT "chk_skus_stock_non_negative" CHECK ("stock" >= 0);
ALTER TABLE "product_skus" ADD CONSTRAINT "chk_skus_price_non_negative" CHECK ("price" >= 0.00 OR "price" IS NULL);

-- 3. Restricciones para la tabla de Items de Pedido (order_items)
ALTER TABLE "order_items" ADD CONSTRAINT "chk_order_items_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "order_items" ADD CONSTRAINT "chk_order_items_unit_price_non_negative" CHECK ("unit_price" >= 0.00);

-- 4. Restricciones para la tabla de Vínculos con Proveedores (product_suppliers)
ALTER TABLE "product_suppliers" ADD CONSTRAINT "chk_prod_suppliers_price_non_negative" CHECK ("current_price" >= 0.00);
ALTER TABLE "product_suppliers" ADD CONSTRAINT "chk_prod_suppliers_cost_non_negative" CHECK ("cost" >= 0.00 OR "cost" IS NULL);
ALTER TABLE "product_suppliers" ADD CONSTRAINT "chk_prod_suppliers_cost_limit" CHECK ("cost" IS NULL OR "cost" <= "current_price");

-- 5. Restricciones para la tabla de Historial de Precios de Proveedores (supplier_product_prices)
ALTER TABLE "supplier_product_prices" ADD CONSTRAINT "chk_supp_prices_price_non_negative" CHECK ("price" >= 0.00);
ALTER TABLE "supplier_product_prices" ADD CONSTRAINT "chk_supp_prices_cost_non_negative" CHECK ("cost" >= 0.00 OR "cost" IS NULL);

-- 6. Restricciones para la tabla de Promociones (promotions)
ALTER TABLE "promotions" ADD CONSTRAINT "chk_promotions_value_non_negative" CHECK ("value" >= 0.00);
ALTER TABLE "promotions" ADD CONSTRAINT "chk_promotions_min_purchase_non_negative" CHECK ("min_purchase_amount" >= 0.00 OR "min_purchase_amount" IS NULL);
ALTER TABLE "promotions" ADD CONSTRAINT "chk_promotions_max_discount_non_negative" CHECK ("max_discount" >= 0.00 OR "max_discount" IS NULL);

-- 7. Restricciones para la tabla de Carrito (cart_items)
ALTER TABLE "cart_items" ADD CONSTRAINT "chk_cart_items_quantity_positive" CHECK ("quantity" > 0);

-- 8. Restricciones para la tabla de Pedidos (orders)
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_total_non_negative" CHECK ("total" >= 0.00);