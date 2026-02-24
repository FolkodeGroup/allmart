-- =============================================================================
-- Migration: 009_create_sales
-- Tabla para registrar ventas cerradas (reportes y analítica).
-- Se dispara automáticamente cuando un pedido llega al estado 'entregado'.
-- Ejecutar con: npm run migrate
-- Revertir con: npm run migrate:down (aplica sección ROLLBACK manual)
-- =============================================================================

-- ─── UP ───────────────────────────────────────────────────────────────────────

-- ─── Tabla sales ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id          UUID           NOT NULL DEFAULT gen_random_uuid(),
  order_id    UUID           NOT NULL,
  total       NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  sold_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT sales_pkey         PRIMARY KEY (id),
  CONSTRAINT sales_order_fk     FOREIGN KEY (order_id) 
    REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT sales_order_unique UNIQUE (order_id) -- Relación 1:1 definitiva
);

-- ─── Índice para reportes por fecha ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON sales (sold_at);

-- ─── Trigger: Registro automático de venta al entregar ───────────────────────
CREATE OR REPLACE FUNCTION register_sale_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el estado cambia a 'entregado' y no existía ya una venta para este pedido
  IF (NEW.status = 'entregado') AND (OLD.status IS DISTINCT FROM 'entregado') THEN
    INSERT INTO sales (order_id, total, sold_at)
    VALUES (NEW.id, NEW.total, NOW())
    ON CONFLICT (order_id) DO NOTHING; -- Evita duplicados si se re-edita a entregado
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_register_sale_on_delivery ON orders;
CREATE TRIGGER trg_register_sale_on_delivery
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION register_sale_on_delivery();

-- =============================================================================
-- ROLLBACK (ejecutar manualmente si se necesita revertir):
--   DROP TRIGGER IF EXISTS trg_register_sale_on_delivery ON orders;
--   DROP FUNCTION IF EXISTS register_sale_on_delivery();
--   DROP TABLE IF EXISTS sales;
-- =============================================================================
