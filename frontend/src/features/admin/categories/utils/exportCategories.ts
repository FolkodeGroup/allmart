import type { Category } from '../../../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

// PDF export utility (jsPDF + autotable)
export async function exportCategoriesToPDF(categories: Category[]) {
  if (!categories || categories.length === 0) {
    alert('No hay categorías para exportar.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(14);
  doc.setTextColor(118, 146, 130); // --color-primary
  doc.text('Reporte de Categorías — Allmart', 14, 12);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 14, 18);

  autoTable(doc, {
    head: [['ID', 'Nombre', 'Slug', 'Descripción', 'Productos', 'Visible']],
    body: categories.map(cat => [
      cat.id.slice(0, 8) + '…',
      cat.name,
      cat.slug,
      cat.description ?? '',
      String(cat.itemCount ?? 0),
      cat.isVisible ? 'Sí' : 'No',
    ]),
    startY: 24,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      fillColor: [118, 146, 130],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [242, 239, 235],
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
      3: { cellWidth: 80 },
      4: { cellWidth: 22 },
      5: { cellWidth: 18 },
    },
  });

  const date = new Date().toISOString().slice(0, 10);
  doc.save(`categories-${date}.pdf`);
}

