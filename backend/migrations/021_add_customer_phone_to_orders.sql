ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(30);

CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
