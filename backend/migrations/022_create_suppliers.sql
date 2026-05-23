-- Crear tabla suppliers
-- Tabla para gestionar proveedores comerciales

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500),
  phone VARCHAR(50) NOT NULL,
  address VARCHAR(500) NOT NULL,
  products TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice en nombre para búsquedas rápidas
CREATE INDEX idx_suppliers_name ON suppliers(name);
