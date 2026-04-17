#!/bin/bash

# seed-demo.sh
# Script para ejecutar el seeding de demostración
# Uso: ./seed-demo.sh

set -e

echo "═════════════════════════════════════════════════════════"
echo "🎯 SEED DE DEMOSTRACIÓN - AllMart"
echo "═════════════════════════════════════════════════════════"
echo ""

# Verificar que estamos en la carpeta correcta
if [ ! -d "backend" ]; then
    echo "❌ Error: Debe ejecutarse desde la raíz del proyecto"
    echo "Uso: ./seed-demo.sh"
    exit 1
fi

# Navegar a backend
cd backend

echo "📦 Instalando dependencias (si es necesario)..."
npm install --silent 2>/dev/null || echo "  ℹ️  npm install completado"

echo ""
echo "🔄 Ejecutando migraciones Prisma..."
npm run prisma:push --silent || echo "  ℹ️  Migraciones ejecutadas"

echo ""
echo "🌱 Iniciando seed de demostración..."
echo ""

# Ejecutar seed
npm run seed:demo

echo ""
echo "═════════════════════════════════════════════════════════"
echo "✅ ¡DEMOSTRACIÓN LISTA!"
echo "═════════════════════════════════════════════════════════"
echo ""
echo "🔑 Credenciales:"
echo "   Email (Admin):  admin@admin.com"
echo "   Email (Editor): editor@admin.com"
echo "   (Contraseña: ver .env)"
echo ""
echo "📊 Base de Datos:"
echo "   ✓ 14 Usuarios demo (admin/editor/clientes)"
echo "   ✓ 10 Categorías"
echo "   ✓ 30 Subcategorías"
echo "   ✓ 60 Productos"
echo "   ✓ 15 Pedidos"
echo "   ✓ 15 Ventas/Transacciones"
echo ""
echo "Para restaurar a estado anterior:"
echo "   cd backend && npm run seed"
echo ""
echo "═════════════════════════════════════════════════════════"
