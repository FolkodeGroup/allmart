import { utils, writeFile } from 'xlsx';

export interface ExportableProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  discount?: number;
  stock: number;
  inStock: boolean;
  createdAt?: string;
}

function formatDate(date: string | Date | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

export function exportProductsToCSV(products: ExportableProduct[]) {
  if (!products || products.length === 0) {
    alert('No hay productos para exportar.');
    return;
  }
  const headers = ['ID', 'Nombre', 'Categoría', 'Precio', 'Descuento', 'Stock', 'Estado', 'Fecha de creación'];
  const rows = products.map(p => [
    p.id,
    p.name,
    p.category,
    p.price,
    p.discount ?? '',
    p.stock,
    p.inStock ? 'Activo' : 'Inactivo',
    formatDate(p.createdAt)
  ]);
  const csvContent = [headers, ...rows].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}` ).join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = formatDate(new Date());
  a.href = url;
  a.download = `products-${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportProductsToExcel(products: ExportableProduct[]) {
  if (!products || products.length === 0) {
    alert('No hay productos para exportar.');
    return;
  }
  const data = products.map(p => ({
    ID: p.id,
    Nombre: p.name,
    Categoría: p.category,
    Precio: p.price,
    Descuento: p.discount ?? '',
    Stock: p.stock,
    Estado: p.inStock ? 'Activo' : 'Inactivo',
    'Fecha de creación': formatDate(p.createdAt)
  }));
  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Productos');
  const date = formatDate(new Date());
  writeFile(wb, `products-${date}.xlsx`);
}
