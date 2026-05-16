#!/bin/bash

# reset-demo-db.sh
# Limpia y repuebla la base de datos con datos demo completos.
# Útil para volver a un estado consistente con muchos datos para revisar la UI.
#
# Uso: ./scripts/reset-demo-db.sh
# Requisitos: túnel SSH activo (./scripts/start-db-tunnel.sh) o DB local corriendo

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "═════════════════════════════════════════════════════════"
echo "🔄 RESET + SEED DEMO — AllMart"
echo "═════════════════════════════════════════════════════════"
echo ""

# Verificar que existe el directorio backend
if [ ! -d "$BACKEND_DIR" ]; then
  echo "❌ Error: No se encontró el directorio backend en $BACKEND_DIR"
  exit 1
fi

# Cargar variables de entorno
if [ -f "$BACKEND_DIR/.env" ]; then
  set -a
  source "$BACKEND_DIR/.env"
  set +a
else
  echo "❌ Error: No se encontró $BACKEND_DIR/.env"
  exit 1
fi

# Verificar conexión a la base de datos
echo "🔌 Verificando conexión a la base de datos..."
if ! pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -q; then
  echo ""
  echo "❌ No se puede conectar a la base de datos."
  echo "   Host: ${DB_HOST:-localhost}:${DB_PORT:-5432}"
  echo ""
  echo "   Si usas el VPS, asegúrate de tener el túnel SSH activo:"
  echo "   ./scripts/start-db-tunnel.sh"
  exit 1
fi
echo "   ✅ Conexión OK → ${DB_HOST:-localhost}:${DB_PORT:-5432}/$DB_NAME"
echo ""

# Confirmación (salvo que se pase --yes o -y)
if [[ "$1" != "--yes" && "$1" != "-y" ]]; then
  echo "⚠️  ADVERTENCIA: Esto eliminará TODOS los datos actuales de la base de datos."
  echo "   Usuarios, productos, categorías, pedidos y ventas serán borrados y"
  echo "   reemplazados por datos de demostración."
  echo ""
  read -rp "   ¿Continuar? [s/N]: " confirm
  if [[ ! "$confirm" =~ ^[sS]$ ]]; then
    echo ""
    echo "Operación cancelada."
    exit 0
  fi
  echo ""
fi

cd "$BACKEND_DIR"

# Paso 1: Limpiar tablas (orden inverso de dependencias FK)
echo "🗑️  Limpiando base de datos..."
PGPASSWORD="$DB_PASSWORD" psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -q <<'SQL'
  DO $$
  DECLARE
    t text;
    tables text[] := ARRAY[
      'sales', 'order_status_history', 'order_items', 'orders',
      'cart_items', 'carts', 'shipments', 'product_reviews', 'favorites',
      'low_stock_alerts', 'collection_items', 'collections',
      'promotion_rules', 'promotions', 'product_variants',
      'product_images_storage', 'product_categories', 'products',
      'category_images_storage', 'banners', 'staff_notes', 'categories', 'users'
    ];
  BEGIN
    FOREACH t IN ARRAY tables LOOP
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = t
      ) THEN
        EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE', t);
      END IF;
    END LOOP;
  END $$;
SQL
echo "   ✅ Tablas limpiadas"
echo ""

# Paso 2: Ejecutar seed demo
echo "🌱 Ejecutando seed de demostración..."
echo ""
npm run seed:demo

echo ""
echo "═════════════════════════════════════════════════════════"
echo "✅ Base de datos restaurada al estado demo"
echo "═════════════════════════════════════════════════════════"
echo ""
echo "🔑 Credenciales:"
echo "   Admin:  admin@admin.com  / ver SEED_ADMIN_PASSWORD en .env"
echo "   Editor: editor@admin.com / ver SEED_EDITOR_PASSWORD en .env"
echo ""
echo "📊 Datos cargados:"
echo "   ✓ 14 Usuarios (admin + editor + clientes demo)"
echo "   ✓ 10 Categorías raíz"
echo "   ✓ 30 Subcategorías"
echo "   ✓ 60 Productos"
echo "   ✓ 15 Pedidos con historial de estados"
echo "   ✓ 15 Ventas/Transacciones"
echo ""
echo "Para restaurar de nuevo en cualquier momento:"
echo "   ./scripts/reset-demo-db.sh"
echo "   ./scripts/reset-demo-db.sh --yes   (sin confirmación)"
echo "═════════════════════════════════════════════════════════"
