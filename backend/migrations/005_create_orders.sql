-- =============================================================================
-- Migration: 005_create_orders
-- Tablas para la gestión de pedidos y sus respectivos ítems.
-- Ejecutar con: npm run migrate
-- Revertir con: npm run migrate:down (aplica sección ROLLBACK manual)
-- =============================================================================

-- ─── UP ───────────────────────────────────────────────────────────────────────

-- ─── Tipo enum para estado del pedido ────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pendiente', 
    'confirmado', 
    'en-preparacion', 
    'enviado', 
    'entregado', 
    'cancelado'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── Tipo enum para estado del pago ──────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'no-abonado', 
    'abonado'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── Tabla orders ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                   UUID           NOT NULL DEFAULT gen_random_uuid(),
  customer_first_name  VARCHAR(100)   NOT NULL,
  customer_last_name   VARCHAR(100)   NOT NULL,
  customer_email       VARCHAR(255)   NOT NULL,
  total                NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  status               order_status   NOT NULL DEFAULT 'pendiente',
  payment_status       payment_status NOT NULL DEFAULT 'no-abonado',
  paid_at              TIMESTAMPTZ,
  notes                TEXT,
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT orders_pkey PRIMARY KEY (id)
);

-- ─── Tabla order_items ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id            UUID           NOT NULL DEFAULT gen_random_uuid(),
  order_id      UUID           NOT NULL,
  product_id    UUID,           -- Opcional (por si el producto desaparece del catálogo)
  product_name  VARCHAR(255)   NOT NULL, -- Desnormalizado para historial
  product_image TEXT,                    -- Desnormalizado para historial
  quantity      INTEGER        NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),

  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_fk FOREIGN KEY (order_id) 
    REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_fk FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE SET NULL
);

-- ─── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_status         ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON orders (created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id  ON order_items (order_id);

-- ─── Trigger: actualizar updated_at automáticamente ──────────────────────────
DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- ROLLBACK (ejecutar manualmente si se necesita revertir):
--   DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
--   DROP TABLE IF EXISTS order_items;
--   DROP TABLE IF EXISTS orders;
--   DROP TYPE IF EXISTS payment_status;
--   DROP TYPE IF EXISTS order_status;
-- =============================================================================
