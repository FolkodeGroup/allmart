// frontend/src/utils/exportProducts.ts

export interface ExportableProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  discount?: number;
  stock: number;
  inStock: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  imageUrl?: string;
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
  const csvContent = [headers, ...rows].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"` ).join(',')).join('\r\n');
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

export async function exportProductsToExcel(products: ExportableProduct[]) {
  if (!products || products.length === 0) {
    alert('No hay productos para exportar.');
    return;
  }
  const XLSX = await import('xlsx');
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
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  const date = formatDate(new Date());
  XLSX.writeFile(wb, `products-${date}.xlsx`);
}

/**
 * Carga una imagen de URL o la convierte a data URI Base64 para incrustar en jsPDF
 */
async function loadImageAsDataUri(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 200, 200);
        ctx.drawImage(img, 0, 0, 200, 200);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Generador de catálogo PDF del cliente (WhatsApp Ready con Imágenes amplias e Identidad Allmart)
 */
export async function exportProductsPDF(products: ExportableProduct[], fileName?: string) {
  if (!products || products.length === 0) {
    alert('No hay productos para exportar.');
    return;
  }

  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape' });

  // 🟢 1. BANNER DE ENCABEZADO CON VERDE INSTITUCIONAL ALLMART (#769282)
  doc.setFillColor(118, 146, 130);
  doc.roundedRect(10, 8, 277, 22, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('ALLMART', 18, 16);

  doc.setFontSize(14);
  doc.text('Catálogo Allmart', 18, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 240, 20);

  // Pre-cargar imágenes para el catálogo
  const imagesDataUris: (string | null)[] = await Promise.all(
    products.map(p => p.imageUrl ? loadImageAsDataUri(p.imageUrl) : Promise.resolve(null))
  );

  // 🟢 2. REEMPLAZO DE COLUMNA ID POR "IMAGEN" Y FORMATO DE TABLA
  autoTable(doc, {
    head: [['Imagen', 'Nombre', 'Categoría', 'Precio', 'Stock', 'Estado']],
    body: products.map((p) => [
      '', // Columna 0 vacía (se dibuja la imagen en didDrawCell)
      p.name,
      p.category,
      `$${Number(p.price).toLocaleString('es-AR')}`,
      `${p.stock} un.`,
      p.inStock ? 'Activo' : 'Inactivo',
    ]),
    startY: 34,
    styles: {
      fontSize: 9,
      cellPadding: 4,
      overflow: 'linebreak',
      valign: 'middle',
      minCellHeight: 28, // 🟢 Altura amplia para destacar la imagen
    },
    headStyles: {
      fillColor: [118, 146, 130], // Verde primario Allmart #769282
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [242, 239, 235], // Fondo cálido Allmart #f2efeb
    },
    columnStyles: {
      0: { cellWidth: 32, halign: 'center' },
      1: { cellWidth: 100 },
      2: { cellWidth: 50 },
      3: { cellWidth: 35, fontStyle: 'bold' },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const rowIndex = data.row.index;
        const imgDataUri = imagesDataUris[rowIndex];
        if (imgDataUri) {
          const dim = 22; // 22mm x 22mm (~90px), tamaño destacado para WhatsApp
          const cellX = data.cell.x + (data.cell.width - dim) / 2;
          const cellY = data.cell.y + (data.cell.height - dim) / 2;
          try {
            doc.addImage(imgDataUri, 'JPEG', cellX, cellY, dim, dim);
          } catch {
            // ignore draw error
          }
        }
      }
    },
    margin: { top: 34, left: 10, right: 10 },
  });

  const dateStr = formatDate(new Date());
  doc.save(fileName ?? `catalogo_allmart_${dateStr}.pdf`);
}