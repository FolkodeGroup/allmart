-- =============================================================================
-- Migration: 001_create_users
-- Tabla de usuarios (clientes y administradores del sistema)
-- Ejecutar con: npm run migrate
-- =============================================================================

-- ─── Tipo enum para roles ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'editor', 'customer');
EXCEPTION
  WHEN duplicate_object THEN NULL; -- Ya existe, ignorar
END $$;

-- ─── Tabla users ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID          NOT NULL DEFAULT gen_random_uuid(),
  first_name    VARCHAR(100)  NOT NULL,
  last_name     VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  password_hash TEXT          NOT NULL,
  role          user_role     NOT NULL DEFAULT 'customer',
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT users_pkey        PRIMARY KEY (id),
  CONSTRAINT users_email_unique UNIQUE (email)
);

-- ─── Índice en email para búsquedas rápidas ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ─── Índice en role para filtros de administración ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- ─── Trigger: actualizar updated_at automáticamente ──────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- =============================================================================
-- Migration: 002_create_categories
-- Tabla de categorías de productos (cocina, baño, mate y café, etc.)
-- Ejecutar con: npm run migrate
-- Revertir con: npm run migrate:down (aplica sección ROLLBACK manual)
-- =============================================================================

-- ─── UP ───────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id          UUID          NOT NULL DEFAULT gen_random_uuid(),
  name        VARCHAR(150)  NOT NULL,
  slug        VARCHAR(150)  NOT NULL,
  description TEXT,
  image_url   TEXT,
  item_count  INTEGER       NOT NULL DEFAULT 0 CHECK (item_count >= 0),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT categories_pkey        PRIMARY KEY (id),
  CONSTRAINT categories_slug_unique UNIQUE (slug)
);

-- ─── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);

-- ─── Trigger: actualizar updated_at automáticamente ──────────────────────────
-- La función set_updated_at() ya fue creada en 001_create_users.sql.
-- Se reutiliza aquí.
DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Trigger: recalcular item_count desde products (preparado) ────────────────
-- Cuando se implemente la tabla products, el siguiente trigger
-- mantendrá item_count sincronizado automáticamente.
-- Se registra aquí como referencia para la migración de products.
--
-- CREATE OR REPLACE FUNCTION sync_category_item_count()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   UPDATE categories
--   SET    item_count = (
--     SELECT COUNT(*) FROM products
--     WHERE  category_id = COALESCE(NEW.category_id, OLD.category_id)
--       AND  status = 'active'
--   )
--   WHERE id = COALESCE(NEW.category_id, OLD.category_id);
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- =============================================================================
-- ROLLBACK (ejecutar manualmente si se necesita revertir):
--   DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
--   DROP TABLE IF EXISTS categories;
-- =============================================================================
-- =============================================================================
-- Migration: 003_create_products
-- Tabla de productos del catálogo.
-- Refleja la interfaz Product del frontend y el modelo Product del backend.
-- Ejecutar con: npm run migrate
-- Revertir con: npm run migrate:down (aplica sección ROLLBACK manual)
-- =============================================================================

-- ─── UP ───────────────────────────────────────────────────────────────────────

-- ─── Tipo enum para estado del producto ──────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('active', 'inactive', 'draft', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL; -- Ya existe, ignorar
END $$;

-- ─── Tabla products ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                UUID           NOT NULL DEFAULT gen_random_uuid(),
  name              VARCHAR(255)   NOT NULL,
  slug              VARCHAR(255)   NOT NULL,
  description       TEXT,
  short_description TEXT,
  price             NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  original_price    NUMERIC(12, 2)           CHECK (original_price >= 0),
  discount          NUMERIC(5, 2)            CHECK (discount >= 0 AND discount <= 100),
  images            JSONB          NOT NULL DEFAULT '[]',
  category_id       UUID,
  tags              JSONB          NOT NULL DEFAULT '[]',
  rating            NUMERIC(3, 2)  NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count      INTEGER        NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  in_stock          BOOLEAN        NOT NULL DEFAULT TRUE,
  stock             INTEGER        NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku               VARCHAR(100),
  features          JSONB          NOT NULL DEFAULT '[]',
  status            product_status NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT products_pkey        PRIMARY KEY (id),
  CONSTRAINT products_slug_unique UNIQUE (slug),
  CONSTRAINT products_sku_unique  UNIQUE (sku),
  CONSTRAINT products_category_fk FOREIGN KEY (category_id)
    REFERENCES categories (id) ON DELETE SET NULL
);

-- ─── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_slug        ON products (slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_status      ON products (status);
CREATE INDEX IF NOT EXISTS idx_products_sku         ON products (sku);

-- ─── Trigger: actualizar updated_at automáticamente ──────────────────────────
-- La función set_updated_at() ya fue creada en 001_create_users.sql.
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Trigger: sincronizar item_count en categories ───────────────────────────
-- Mantiene categories.item_count actualizado cuando se insertan,
-- actualizan o eliminan productos activos.
CREATE OR REPLACE FUNCTION sync_category_item_count()
RETURNS TRIGGER AS $$
DECLARE
  affected_category_id UUID;
BEGIN
  -- Determinar la categoría afectada según la operación
  IF TG_OP = 'DELETE' THEN
    affected_category_id := OLD.category_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si cambió la categoría, recalcular tanto la antigua como la nueva
    IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
      IF OLD.category_id IS NOT NULL THEN
        UPDATE categories
        SET item_count = (
          SELECT COUNT(*) FROM products
          WHERE category_id = OLD.category_id AND status = 'active'
        )
        WHERE id = OLD.category_id;
      END IF;
    END IF;
    affected_category_id := NEW.category_id;
  ELSE
    -- INSERT
    affected_category_id := NEW.category_id;
  END IF;

  -- Recalcular item_count para la categoría afectada
  IF affected_category_id IS NOT NULL THEN
    UPDATE categories
    SET item_count = (
      SELECT COUNT(*) FROM products
      WHERE category_id = affected_category_id AND status = 'active'
    )
    WHERE id = affected_category_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_sync_category_count ON products;
CREATE TRIGGER trg_products_sync_category_count
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION sync_category_item_count();

-- =============================================================================
-- ROLLBACK (ejecutar manualmente si se necesita revertir):
--   DROP TRIGGER IF EXISTS trg_products_sync_category_count ON products;
--   DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
--   DROP FUNCTION IF EXISTS sync_category_item_count();
--   DROP TABLE IF EXISTS products;
--   DROP TYPE IF EXISTS product_status;
-- =============================================================================
-- =============================================================================
-- Migration: 004_create_product_variants
-- Tabla de grupos de variantes de productos (ej: Color, Talle)
-- Ejecutar con: npm run migrate
-- Revertir con: npm run migrate:down (aplica sección ROLLBACK manual)
-- =============================================================================

-- ─── UP ───────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_variants (
  id          UUID         NOT NULL DEFAULT gen_random_uuid(),
  product_id  UUID         NOT NULL,
  name        VARCHAR(100) NOT NULL, -- Ej: "Color", "Talle"
  values      JSONB        NOT NULL DEFAULT '[]', -- Array de strings
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_product_fk FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_name       ON product_variants (name);

-- Trigger: actualizar updated_at automáticamente
-- Reutiliza la función set_updated_at() de migraciones previas
DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON product_variants;
CREATE TRIGGER trg_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- ROLLBACK (ejecutar manualmente si se necesita revertir):
--   DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON product_variants;
--   DROP TABLE IF EXISTS product_variants;
-- =============================================================================
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
-- Migration: 014_create_banners
-- Tabla de banners con almacenamiento de imágenes binarias en DB
-- =============================================================================

-- ─── Tabla banners ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
  id                UUID          NOT NULL DEFAULT gen_random_uuid(),
  title             VARCHAR(255)  NOT NULL,
  description       TEXT,
  data              BYTEA         NOT NULL,  -- Imagen WebP completa
  width             INTEGER       NOT NULL,
  height            INTEGER       NOT NULL,
  thumbnail         BYTEA,                   -- Miniatura WebP (~600px)
  thumb_width       INTEGER,
  thumb_height      INTEGER,
  mime_type         VARCHAR(50)   NOT NULL DEFAULT 'image/webp',
  original_filename VARCHAR(255),
  size_bytes        INTEGER       NOT NULL,
  alt_text          VARCHAR(500),
  display_order     INTEGER       NOT NULL DEFAULT 0,
  is_active         BOOLEAN       NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT banners_pkey PRIMARY KEY (id)
);

-- ─── Índices para queries frecuentes ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners (is_active);
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners (display_order);

-- ─── Trigger: actualizar updated_at automáticamente ──────────────────────────
DROP TRIGGER IF EXISTS trg_banners_updated_at ON banners;
CREATE TRIGGER trg_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- ROLLBACK (ejecutar manualmente si se necesita revertir):
--   DROP TRIGGER IF EXISTS trg_register_sale_on_delivery ON orders;
--   DROP FUNCTION IF EXISTS register_sale_on_delivery();
--   DROP TABLE IF EXISTS sales;
-- =============================================================================
