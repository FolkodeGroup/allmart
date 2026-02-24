-- =============================================================================
-- Migration: 008_create_shipments
-- Tabla para la gestión de envíos asociados a los pedidos (Relación 1:1).
-- Ejecutar con: npm run migrate
-- Revertir con: npm run migrate:down (aplica sección ROLLBACK manual)
-- =============================================================================

-- ─── UP ───────────────────────────────────────────────────────────────────────

-- ─── Tabla shipments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipments (
  id                UUID         NOT NULL DEFAULT gen_random_uuid(),
  order_id          UUID         NOT NULL,
  address_street    VARCHAR(255) NOT NULL,
  address_city      VARCHAR(150) NOT NULL,
  address_province  VARCHAR(150) NOT NULL,
  address_zip       VARCHAR(20)  NOT NULL,
  carrier           VARCHAR(100),
  tracking_number   VARCHAR(100),
  status            VARCHAR(50)  NOT NULL DEFAULT 'pending', -- Estado del envío
  shipped_at        TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT shipments_pkey       PRIMARY KEY (id),
  CONSTRAINT shipments_order_fk   FOREIGN KEY (order_id) 
    REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT shipments_order_unique UNIQUE (order_id) -- Relación 1:1
);

-- ─── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_shipments_order_id        ON shipments (order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments (tracking_number);

-- ─── Trigger: actualizar updated_at automáticamente ──────────────────────────
DROP TRIGGER IF EXISTS trg_shipments_updated_at ON shipments;
CREATE TRIGGER trg_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- ROLLBACK (ejecutar manualmente si se necesita revertir):
--   DROP TRIGGER IF EXISTS trg_shipments_updated_at ON shipments;
--   DROP TABLE IF EXISTS shipments;
-- =============================================================================
