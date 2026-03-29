import type { Category } from '../../../../types';

// CSV export utility
export function exportCategoriesToCSV(categories: Category[]) {
  if (!categories || categories.length === 0) {
    alert('No hay categorías para exportar.');
    return;
  }
  const headers = ['ID', 'Nombre', 'Slug', 'Descripción', 'Imagen', 'Cantidad de productos', 'Visible'];
  const rows = categories.map(cat => [
    cat.id,
    cat.name,
    cat.slug,
    cat.description ?? '',
    cat.image ?? '',
    cat.itemCount ?? '',
    cat.isVisible ? 'Sí' : 'No',
  ]);
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'categories.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Excel export utility (SheetJS)
export async function exportCategoriesToExcel(categories: Category[]) {
  if (!categories || categories.length === 0) {
    alert('No hay categorías para exportar.');
    return;
  }
  // Dynamically import xlsx for performance
  const XLSX = await import('xlsx');
  const data = categories.map(cat => ({
    ID: cat.id,
    Nombre: cat.name,
    Slug: cat.slug,
    Descripción: cat.description ?? '',
    Imagen: cat.image ?? '',
    'Cantidad de productos': cat.itemCount ?? '',
    Visible: cat.isVisible ? 'Sí' : 'No',
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Categorías');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'categories.xlsx');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
