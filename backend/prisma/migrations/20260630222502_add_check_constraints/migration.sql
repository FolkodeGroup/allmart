-- 1. Restricciones de precio y stock para Productos
ALTER TABLE products ADD CONSTRAINT chk_products_price CHECK (price >= 0);
ALTER TABLE products ADD CONSTRAINT chk_products_stock CHECK (stock >= 0);

-- 2. Restricciones de precio y stock para variantes (SKUs)
ALTER TABLE product_skus ADD CONSTRAINT chk_product_skus_price CHECK (price >= 0 OR price IS NULL);
ALTER TABLE product_skus ADD CONSTRAINT chk_product_skus_stock CHECK (stock >= 0);

-- 3. Restricciones de costos y precios con Proveedores
ALTER TABLE product_suppliers ADD CONSTRAINT chk_product_suppliers_price CHECK (current_price >= 0);
ALTER TABLE product_suppliers ADD CONSTRAINT chk_product_suppliers_cost CHECK (cost >= 0 OR cost IS NULL);

-- 4. Restricciones de totales e histórico para Clientes
ALTER TABLE customers ADD CONSTRAINT chk_customers_orders CHECK (total_orders >= 0);
ALTER TABLE customers ADD CONSTRAINT chk_customers_spent CHECK (total_spent >= 0);