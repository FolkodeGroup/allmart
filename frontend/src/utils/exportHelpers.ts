import type { Order } from '../context/AdminOrdersContext';
import * as XLSX from 'xlsx';
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

export function exportOrdersCSV(orders: Order[], fileName: string): void {
    const headers = ['ID', 'Fecha', 'Cliente', 'Email', 'Productos', 'Total', 'Estado', 'Pago'];
    const rows = orders.map(o => [
        o.id,
        new Date(o.createdAt).toLocaleDateString('es-AR'),
        `${o.customer.firstName} ${o.customer.lastName}`,
        o.customer.email,
        o.items.map(i => `${i.productName} x${i.quantity}`).join(' | '),
        o.total.toString().replace('.', ','),
        o.status,
        o.paymentStatus ?? 'no-abonado',
    ]);
    const csv = [headers, ...rows]
        .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, fileName);
}

export function exportOrdersXLSX(orders: Order[], fileName: string) {
    const wsData = [
        ['ID', 'Fecha', 'Cliente', 'Email', 'Productos', 'Total', 'Estado', 'Pago'],
        ...orders.map(o => [
            o.id,
            new Date(o.createdAt).toLocaleDateString('es-AR'),
            `${o.customer.firstName} ${o.customer.lastName}`,
            o.customer.email,
            o.items.map(i => `${i.productName} x${i.quantity}`).join(' | '),
            o.total,
            o.status,
            o.paymentStatus ?? 'no-abonado',
        ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    triggerDownload(blob, fileName);
}

export async function exportOrdersPDF(orders: Order[], fileName: string) {
    // Importación dinámica para evitar cargar la librería si no se usa

    const doc = new jsPDF();
    const headers = [['ID', 'Fecha', 'Cliente', 'Email', 'Productos', 'Total', 'Estado', 'Pago']];
    const rows = orders.map(o => [
        o.id,
        new Date(o.createdAt).toLocaleDateString('es-AR'),
        `${o.customer.firstName} ${o.customer.lastName}`,
        o.customer.email,
        o.items.map(i => `${i.productName} x${i.quantity}`).join(' | '),
        o.total,
        o.status,
        o.paymentStatus ?? 'no-abonado',
    ]);
    autoTable(doc, {
        head: headers,
        body: rows,
        styles: { fontSize: 9 },
        margin: { top: 18 },
        headStyles: { fillColor: [38, 166, 154] },
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
