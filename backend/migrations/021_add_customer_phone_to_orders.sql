ALTER TABLE orders
ADD COLUMN customer_phone VARCHAR(30);

CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
