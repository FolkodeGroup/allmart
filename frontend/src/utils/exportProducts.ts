// frontend/src/utils/exportProducts.ts

export interface ExportableProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  imageUrl?: string;
  discount?: number;
  stock?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
}

function formatDate(date: string | Date | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Sanitiza el texto para evitar que jsPDF se rompa con caracteres no soportados (emojis, UTF-8 complejos).
 * Mantiene el texto legible, fuerza saltos de línea y lo hace compatible con la fuente Helvetica (ASCII).
 */
function sanitizeTextForPDF(text: string | undefined | null): string {
  if (!text) return '';
  
  // 1. Eliminar etiquetas HTML (reemplazar por espacio para no juntar palabras)
  let clean = text.replace(/<[^>]*>?/gm, ' ');
  
  // 2. Normalizar a NFD para separar acentos de las letras (ej: á -> a + ´) y eliminarlos
  clean = clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // 3. Reemplazos manuales para caracteres tipográficos que rompen jsPDF
  clean = clean.replace(/[\u2018\u2019]/g, "'")
               .replace(/[\u201C\u201D]/g, '"')
               .replace(/[\u2013\u2014]/g, '-')
               .replace(/[\u2026]/g, '...')
               .replace(/[¿¡]/g, '');
               
  // 4. Eliminar TODO lo que no sea ASCII básico (32 a 126) y saltos de línea
  clean = clean.replace(/[^\x20-\x7E\n\r]/g, '');
  
  // 5. Limpiar espacios múltiples pero preservar saltos de línea
  clean = clean.replace(/[ \t]+/g, ' ');
  
  return clean.trim();
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

const ALLMART_LOGO_SVG = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 410.87 188.52"><defs><style>.cls-1{fill:#fff;}</style></defs><path class="cls-1" d="M109.59,96.99l-21.16,22.33c-.44.46-.9.89-1.4,1.28-.53.42-1.22.94-1.71,1.24-2.37,1.44-5.04,2.16-8.03,2.16s-5.55-.69-7.3-2.06c-1.75-1.37-2.63-3.23-2.63-5.56,0-2.06.71-3.79,2.14-5.2,1.43-1.41,4.22-2.11,8.37-2.11h12.55v.07l12.11-12.81c-.07-1.63-.8-4.02-.8-4.02-.03-.09-.06-.18-.08-.26,0-.02-.02-.06-.02-.06-1.18-3.96-3.12-7.07-5.86-9.28-4.29-3.46-11.06-5.19-20.29-5.19h-15.56v10.34l16.23.11c4.43,0,7.12.09,9.06,1.11,3.44,1.8,4.78,4.3,4.98,6.05.18,1.57.23,3.3.23,4.58v.82h-13.43c-5.25,0-9.47.72-12.65,2.16-3.18,1.44-5.47,3.4-6.86,5.87-1.4,2.47-2.09,5.25-2.09,8.34s.79,5.99,2.38,8.5c1.59,2.51,3.84,4.46,6.76,5.87,2.92,1.41,6.33,2.11,10.22,2.11,4.61,0,8.42-.89,11.44-2.68,2.08-1.23,3.71-2.81,4.91-4.73v6.69h11.48v-16.47l6.99-7.4v23.87h12.16V56.24h-12.16v40.76Z"/><rect class="cls-1" x="128.87" y="56.24" width="12.16" height="76.42"/><path class="cls-1" d="M225.55,79.62c-3.21-1.71-6.89-2.57-11.04-2.57-5.13,0-9.63,1.24-13.53,3.71-2.39,1.52-4.37,3.36-5.93,5.5-1.24-2.19-2.84-4-4.83-5.4-3.6-2.54-7.83-3.81-12.7-3.81-4.28,0-8.09.93-11.43,2.78-2.22,1.23-4.08,2.85-5.6,4.84v-7h-11.58v55h12.16v-27.91c0-3.71.57-6.76,1.7-9.17,1.13-2.4,2.73-4.22,4.77-5.46,2.04-1.24,4.39-1.85,7.06-1.85,3.76,0,6.65,1.2,8.66,3.61,2.01,2.4,3.02,6.04,3.02,10.92v29.87h12.16v-27.91c0-3.71.57-6.76,1.7-9.17,1.13-2.4,2.72-4.22,4.77-5.46,2.04-1.24,4.39-1.85,7.06-1.85,3.76,0,6.65,1.2,8.66,3.61,2.01,2.4,3.02,6.04,3.02,10.92v29.87h12.16v-31.52c0-5.56-.91-10.11-2.73-13.65-1.82-3.54-4.33-6.16-7.54-7.88Z"/><path class="cls-1" d="M304.46,85.35l-.26-.27v-7.42h-11.58v19.33l-7,7.4v-.07l-14.17,15c-.44.46-.9.89-1.4,1.28-.53.42-1.22.94-1.71,1.24-2.37,1.44-5.04,2.16-8.03,2.16s-5.55-.69-7.3-2.06c-1.75-1.37-2.63-3.23-2.63-5.56,0-2.06.71-3.79,2.14-5.2,1.43-1.41,4.22-2.11,8.37-2.11h12.55s12.11-12.81,12.11-12.81c-.07-1.63-.8-3.96-.8-3.96-.03-.09-.06-.18-.08-.26,0-.02-.02-.06-.02-.06-1.18-3.96-3.12-7.07-5.86-9.28-4.29-3.46-11.06-5.19-20.29-5.19h-15.56v10.34l16.23.11c4.43,0,7.12.09,9.06,1.11,3.44,1.8,4.78,4.3,4.98,6.05.18,1.57.23,3.3.23,4.58v.82h-13.43c-5.25,0-9.47.72-12.65,2.16-3.18,1.44-5.47,3.4-6.86,5.87-1.4,2.47-2.09,5.25-2.09,8.34s.79,5.99,2.38,8.5c1.59,2.51,3.84,4.46,6.76,5.87,2.92,1.41,6.33,2.11,10.22,2.11,4.61,0,8.42-.89,11.44-2.68,2.08-1.23,3.71-2.81,4.91-4.73v6.69h11.48v-16.47l7-7.4v23.87h12.16v-26.68c0-5.63,1.36-9.87,4.09-12.72,2.73-2.85,6.39-4.27,11-4.27.45,0,.91.02,1.36.05.45.04.94.12,1.46.26v-12.26c-5,0-9.16.96-12.51,2.88-2.36,1.36-4.26,3.18-5.73,5.43Z"/><path class="cls-1" d="M351.95,120.51c-1.82,1.51-4.09,2.27-6.81,2.27-2.27,0-4.04-.72-5.3-2.16-1.27-1.44-1.9-3.47-1.9-6.08v-26.57h13.92v-10.3h-13.92v-21.28h-12.16v58.47c0,6.11,1.56,10.73,4.67,13.85,3.11,3.13,7.53,4.69,13.24,4.69,2.2,0,4.34-.31,6.42-.93,2.08-.62,3.83-1.55,5.26-2.78l-3.41-9.17Z"/></svg>`;

async function getLogoDataUri(): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const svgBlob = new Blob([ALLMART_LOGO_SVG], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 410;
        canvas.height = img.height || 188;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/**
 * Carga una imagen de URL y la convierte a data URI Base64 en JPEG.
 * Implementa forzado de red (cache: 'reload'), timestamp anti-caché y fallback por Image tag y Proxy.
 */
async function loadImageAsDataUri(url: string): Promise<string | null> {
  if (!url) return null;

  // 1. Normalización de URL
  let targetUrl = url;
  if (url.startsWith('/')) {
    targetUrl = window.location.origin + url;
  }

  // Bypassear el cache local agregando timestamp
  const cacheBuster = `nocache=${Date.now()}`;
  const urlWithCacheBuster = targetUrl.includes('?') 
    ? `${targetUrl}&${cacheBuster}` 
    : `${targetUrl}?${cacheBuster}`;

  // Helper para convertir HTMLImageElement cargado a Canvas JPEG
  const convertImageToDataUri = (img: HTMLImageElement): string | null => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 150;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 150, 150);

      const scale = Math.min(150 / img.width, 150 / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (150 - w) / 2;
      const y = (150 - h) / 2;

      ctx.drawImage(img, x, y, w, h);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (e) {
      console.error('Error dibujando imagen en canvas:', e);
      return null;
    }
  };

  // Método A: Carga mediante fetch + Blob (con cache: 'reload' para forzar a la red)
  const tryFetchMethod = async (requestUrl: string): Promise<string | null> => {
    const response = await fetch(requestUrl, { cache: 'reload' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const blobUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const result = convertImageToDataUri(img);
        URL.revokeObjectURL(blobUrl);
        resolve(result);
      };
      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        resolve(null);
      };
      img.src = blobUrl;
    });
  };

  // Método B: Carga mediante HTMLImageElement con crossOrigin
  const tryImageMethod = async (requestUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        resolve(convertImageToDataUri(img));
      };
      img.onerror = () => resolve(null);
      img.src = requestUrl;
    });
  };

  // 🟢 INTENTOS PROGRESIVOS
  // 1. Intentar Fetch directo con recarga de caché
  try {
    const res = await tryFetchMethod(urlWithCacheBuster);
    if (res) return res;
  } catch {
    // ignorar y pasar al siguiente
  }

  // 2. Intentar Image Tag con crossOrigin
  try {
    const res = await tryImageMethod(urlWithCacheBuster);
    if (res) return res;
  } catch {
    // ignorar y pasar al siguiente
  }

  // 3. Fallback con Proxy público AllOrigins para URLs públicas de Cloudflare R2
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(urlWithCacheBuster)}`;
    const res = await tryFetchMethod(proxyUrl);
    if (res) return res;
  } catch {
    // fallthrough
  }

  return null;
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

  // 🟢 Orientación Horizontal (Landscape)
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // 🟢 1. BANNER DE ENCABEZADO CON VERDE INSTITUCIONAL ALLMART (#769282)
  doc.setFillColor(118, 146, 130);
  doc.roundedRect(14, 14, pageWidth - 28, 26, 3, 3, 'F');

  // Logo
  const logoUri = await getLogoDataUri();
  if (logoUri) {
    doc.addImage(logoUri, 'PNG', 18, 21, 26, 12);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('ALLMART', 18, 28);
  }

  // Título del banner (centrado verticalmente junto al logo)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('Catálogo Allmart', 50, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, pageWidth - 18, 26, { align: 'right' });

  // 🟢 Procesamiento por lotes (Batching) para no saturar la red
  const imagesDataUris: (string | null)[] = [];
  const batchSize = 10;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(p => p.imageUrl ? loadImageAsDataUri(p.imageUrl) : Promise.resolve(null))
    );
    imagesDataUris.push(...batchResults);
  }

  // 🟢 2. TABLA LIMPIA Y ESTILIZADA (Landscape: Imagen, Nombre, Categoría, Precio, Descripción)
  autoTable(doc, {
    head: [['Imagen', 'Nombre', 'Categoría', 'Precio', 'Descripción']],
    body: products.map((p) => [
      '', // Columna 0 vacía (se dibuja la imagen en didDrawCell)
      sanitizeTextForPDF(p.name),
      sanitizeTextForPDF(p.category),
      `$${Number(p.price).toLocaleString('es-AR')}`,
      sanitizeTextForPDF(p.description || ''),
    ]),
    startY: 46,
    styles: {
      fontSize: 9,
      cellPadding: 4,
      overflow: 'linebreak',
      valign: 'middle',
    },
    // 🟢 ENCABEZADO COMPACTO Y ELEGANTE
    headStyles: {
      fillColor: [118, 146, 130], // Verde primario Allmart #769282
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      minCellHeight: 8, // Altura reducida para el header
    },
    // 🟢 CUERPO CON ALTURA ADECUADA PARA LAS MINIATURAS DE IMAGEN
    bodyStyles: {
      minCellHeight: 28, // Mantiene espacio adecuado para la imagen
    },
    alternateRowStyles: {
      fillColor: [242, 239, 235], // Fondo cálido Allmart #f2efeb
    },
    columnStyles: {
      0: { cellWidth: 28, halign: 'center' },
      1: { cellWidth: 60, fontStyle: 'bold', textColor: [26, 26, 26] },
      2: { cellWidth: 35 },
      3: { cellWidth: 25, fontStyle: 'bold', textColor: [200, 154, 112] }, // accentDark #c89a70
      4: { cellWidth: 120, textColor: [118, 118, 118] }, // Ancho fijo para forzar el salto de línea
    },
   didParseCell: (data) => {
    if (data.section === 'head' && data.column.index === 0) {
      data.cell.styles.cellPadding = {
        top: 2.5,
        bottom: 2.5,
        left: 5, // más padding solo para el header "Imagen"
        right: 3,
      };
    }
  },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const rowIndex = data.row.index;
        const imgDataUri = imagesDataUris[rowIndex];
        const dim = 22; // 22mm x 22mm (~90px), tamaño destacado para WhatsApp
        const cellX = data.cell.x + (data.cell.width - dim) / 2;
        const cellY = data.cell.y + (data.cell.height - dim) / 2;
        
        if (imgDataUri) {
          try {
            doc.addImage(imgDataUri, 'JPEG', cellX, cellY, dim, dim);
          } catch {
            // ignore draw error
          }
        } else {
          // Placeholder
          doc.setFillColor(242, 239, 235);
          doc.roundedRect(cellX, cellY, dim, dim, 2, 2, 'F');
          doc.setTextColor(118, 118, 118);
          doc.setFontSize(8);
          doc.text('Sin img', cellX + dim/2, cellY + dim/2, { align: 'center', baseline: 'middle' });
        }
      }
    },
    margin: { top: 46, left: 14, right: 14 },
  });

  const dateStr = formatDate(new Date());
  doc.save(fileName ?? `catalogo_allmart_${dateStr}.pdf`);
}