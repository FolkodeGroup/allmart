-- =============================================================================
-- Migration: 007_create_carts
-- Tablas para la persistencia de carritos de compra (anónimos y autenticados).
-- Ejecutar con: npm run migrate
-- Revertir con: npm run migrate:down (aplica sección ROLLBACK manual)
-- =============================================================================

-- ─── UP ───────────────────────────────────────────────────────────────────────

-- ─── Tabla carts ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS carts (
  id          UUID         NOT NULL DEFAULT gen_random_uuid(),
  user_id     UUID,                     -- Nullable para carritos anónimos
  session_id  VARCHAR(255),             -- Identificador de sesión para anónimos
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT carts_pkey PRIMARY KEY (id),
  CONSTRAINT carts_user_fk FOREIGN KEY (user_id) 
    REFERENCES users (id) ON DELETE CASCADE,
  -- Un usuario autenticado solo debe tener un carrito activo
  CONSTRAINT carts_user_unique UNIQUE (user_id)
);

-- ─── Tabla cart_items ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID         NOT NULL DEFAULT gen_random_uuid(),
  cart_id     UUID         NOT NULL,
  product_id  UUID         NOT NULL,
  quantity    INTEGER      NOT NULL CHECK (quantity > 0),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_cart_fk FOREIGN KEY (cart_id) 
    REFERENCES carts (id) ON DELETE CASCADE,
  CONSTRAINT cart_items_product_fk FOREIGN KEY (product_id) 
    REFERENCES products (id) ON DELETE CASCADE,
  -- Evitar duplicados del mismo producto en el mismo carrito
  CONSTRAINT cart_items_unique_product UNIQUE (cart_id, product_id)
);

-- ─── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_carts_user_id     ON carts (user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_id  ON carts (session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items (cart_id);

-- ─── Trigger: actualizar updated_at automáticamente en carts ─────────────────
DROP TRIGGER IF EXISTS trg_carts_updated_at ON carts;
CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- ROLLBACK (ejecutar manualmente si se necesita revertir):
--   DROP TRIGGER IF EXISTS trg_carts_updated_at ON carts;
--   DROP TABLE IF EXISTS cart_items;
--   DROP TABLE IF EXISTS carts;
-- =============================================================================
