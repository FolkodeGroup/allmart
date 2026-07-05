// frontend/src/utils/exportHelpers.ts
import type { Order } from '../context/AdminOrdersContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export function getExportFileName(base: string, periodLabel: string, ext: string) {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${base}-${periodLabel}-${y}-${m}-${d}.${ext}`;
}

// Helper puro para transformar pedidos a filas exportables
export function mapOrdersToRows(orders: Order[]): (string | number)[][] {
    return orders.map(o => [
        o.id.slice(0, 8).toUpperCase(),
        new Date(o.createdAt).toLocaleDateString('es-AR'),
        `${o.customer.firstName} ${o.customer.lastName}`,
        o.customer.email,
        o.items.map(i => `${i.productName} x${i.quantity}`).join('\n'),
        `$${Number(o.total).toLocaleString('es-AR')}`,
        o.status,
        o.paymentStatus ?? 'no-abonado',
    ]);
}

export function exportOrdersCSV(orders: Order[], fileName: string): void {
    const headers = ['ID', 'Fecha', 'Cliente', 'Email', 'Productos', 'Total', 'Estado', 'Pago'];
    const rows = mapOrdersToRows(orders);
    const csv = [headers, ...rows]
        .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, fileName);
}

// 🟢 MODIFICADO: Importación dinámica de XLSX para excluirlo del bundle inicial
export async function exportOrdersXLSX(orders: Order[], fileName: string) {
    const XLSX = await import('xlsx');
    const wsData = [
        ['ID', 'Fecha', 'Cliente', 'Email', 'Productos', 'Total', 'Estado', 'Pago'],
        ...mapOrdersToRows(orders)
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    triggerDownload(blob, fileName);
}

export async function exportOrdersPDF(orders: Order[], fileName: string) {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(14);
    doc.setTextColor(38, 166, 154);
    doc.text('Reporte de Pedidos', 14, 12);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 14, 18);

    autoTable(doc, {
        head: [['N° Pedido', 'Fecha', 'Cliente', 'Email', 'Productos', 'Total', 'Estado', 'Pago']],
        body: mapOrdersToRows(orders),
        startY: 24,
        styles: {
            fontSize: 7,
            cellPadding: 3,
            overflow: 'linebreak',
            valign: 'top',
        },
        headStyles: {
            fillColor: [38, 166, 154],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8,
        },
        columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 20 },
            2: { cellWidth: 30 },
            3: { cellWidth: 45 },
            4: { cellWidth: 70 },
            5: { cellWidth: 22 },
            6: { cellWidth: 24 },
            7: { cellWidth: 20 },
        },
        alternateRowStyles: {
            fillColor: [245, 250, 249],
        },
        margin: { top: 24, left: 10, right: 10 },
    });

    doc.save(fileName);
}

function triggerDownload(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}