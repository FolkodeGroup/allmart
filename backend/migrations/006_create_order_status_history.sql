-- =============================================================================
-- Migration: 006_create_order_status_history
-- Tabla para el historial de cambios de estado en los pedidos.
-- Incluye trigger para el registro automático ante cambios en orders.
-- Ejecutar con: npm run migrate
-- Revertir con: npm run migrate:down (aplica sección ROLLBACK manual)
-- =============================================================================

-- ─── UP ───────────────────────────────────────────────────────────────────────

-- ─── Tabla order_status_history ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_status_history (
  id          UUID         NOT NULL DEFAULT gen_random_uuid(),
  order_id    UUID         NOT NULL,
  status      order_status NOT NULL, -- Reutiliza el enum order_status de 005
  changed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  note        TEXT,

  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_order_fk FOREIGN KEY (order_id)
    REFERENCES orders (id) ON DELETE CASCADE
);

-- ─── Índice para consultas de historial por pedido ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history (order_id);

-- ─── Trigger: Registro automático de cambios de estado ───────────────────────
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Si es un nuevo pedido o el estado ha cambiado, registrar en el historial
  IF (TG_OP = 'INSERT') OR (NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO order_status_history (order_id, status, changed_at, note)
    VALUES (
      NEW.id, 
      NEW.status, 
      NOW(), 
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'Pedido creado: estado inicial set'
        ELSE CONCAT('Cambio de estado detectado: ', OLD.status::text, ' -> ', NEW.status::text)
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_order_status_change ON orders;
CREATE TRIGGER trg_log_order_status_change
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- =============================================================================
-- ROLLBACK (ejecutar manualmente si se necesita revertir):
--   DROP TRIGGER IF EXISTS trg_log_order_status_change ON orders;
--   DROP FUNCTION IF EXISTS log_order_status_change();
--   DROP TABLE IF EXISTS order_status_history;
-- =============================================================================
