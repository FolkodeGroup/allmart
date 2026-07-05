// frontend/src/utils/exportHelpers.ts
import type { Order } from '../context/AdminOrdersContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
export type ExportFormat = 'csv' | 'xlsx' | 'pdf';
import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';

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


async function captureElementAsBase64(el: HTMLElement | null): Promise<string | null> {
    if (!el) return null;
    const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
    return canvas.toDataURL('image/png');
}

function makeTextBar(value: number, max: number, width = 20): string {
    if (max <= 0) return '';
    const filled = Math.round((value / max) * width);
    return '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, width - filled));
}

const STATUS_LABELS_EXPORT: Record<string, string> = {
    pendiente: 'Pendiente',
    confirmado: 'Confirmado',
    'en-preparacion': 'En preparación',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
};

export async function exportReportsSummaryXLSX(params: {
    metrics: Array<{ key: string; label: string; value: string | number }>;
    barData: Array<{ dateKey: string; label: string; value: number }>;
    statusSlices: Array<{ key: string; count: number }>;
    topProducts: Array<{ id: string; name: string; qty: number; revenue: number }>;
    orders: Order[];
    periodLabel: string;
    fileName: string;
    barChartEl: HTMLElement | null;
    donutChartEl: HTMLElement | null;
}): Promise<void> {
    const {
        metrics, barData, statusSlices, topProducts, orders,
        periodLabel, fileName, donutChartEl,
    } = params;

    const [donutImg] = await Promise.all([
        captureElementAsBase64(donutChartEl),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Allmart';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Reporte');

    sheet.columns = [
        { width: 16 }, { width: 16 }, { width: 16 }, { width: 24 },
        { width: 16 }, { width: 16 }, { width: 3 },
        { width: 20 }, { width: 18 }, { width: 12 },
    ];

    // ── Paleta (misma familia teal que usás en el PDF de pedidos) ──
    const PRIMARY = 'FF769282';       // --color-primary
    const PRIMARY_DARK = 'FF5D7568';  // --color-primary-dark
    const PRIMARY_LIGHT = 'FF8FA99A'; // --color-primary-light
    //const ACCENT = 'FFDDB08C';        // --color-accent
    const ACCENT_DARK = 'FFC89A70';   // --color-accent-dark
    const BAND = 'FFF9F7F4';          // --color-bg-tertiary
    const WHITE = 'FFFFFFFF';         // --color-neutral-light
    const GRAY = 'FF767676';          // --color-text-tertiary

    const solidFill = (argb: string): ExcelJS.Fill => ({
        type: 'pattern', pattern: 'solid', fgColor: { argb },
    });

    function styleSectionTitle(rowNum: number, span: number) {
        sheet.mergeCells(rowNum, 1, rowNum, span);
        const cell = sheet.getCell(rowNum, 1);
        cell.font = { bold: true, size: 12, color: { argb: WHITE } };
        cell.fill = solidFill(PRIMARY_DARK); // antes: TEAL_DARK
        cell.alignment = { vertical: 'middle' };
        sheet.getRow(rowNum).height = 20;
    }

    function styleHeaderRow(rowNum: number, colStart: number, colEnd: number) {
        const r = sheet.getRow(rowNum);
        r.font = { bold: true, color: { argb: WHITE } };
        for (let c = colStart; c <= colEnd; c++) {
            r.getCell(c).fill = solidFill(PRIMARY_LIGHT); // antes: TEAL_LIGHT
        }
    }

    function bandRow(rowNum: number, colStart: number, colEnd: number, isEven: boolean) {
        if (!isEven) return;
        for (let c = colStart; c <= colEnd; c++) {
            sheet.getCell(rowNum, c).fill = solidFill(BAND);
        }
    }

    let row = 1;

    // ── Header principal ──
    sheet.mergeCells(`A${row}:D${row}`);
    sheet.getCell(`A${row}`).value = 'REPORTE DE PEDIDOS';
    sheet.getCell(`A${row}`).font = { bold: true, size: 16, color: { argb: WHITE } };
    sheet.getCell(`A${row}`).fill = solidFill(PRIMARY);
    sheet.getCell(`A${row}`).alignment = { vertical: 'middle' };
    sheet.getRow(row).height = 26;
    row++;

    sheet.getCell(`A${row}`).value = `Generado: ${new Date().toLocaleString('es-AR')}`;
    sheet.getCell(`A${row}`).font = { italic: true, color: { argb: GRAY } };
    row++;
    sheet.getCell(`A${row}`).value = `Período: ${periodLabel}`;
    sheet.getCell(`A${row}`).font = { italic: true, color: { argb: GRAY } };
    row += 2;

    // ── KPIs ──
    styleSectionTitle(row, 2);
    sheet.getCell(`A${row}`).value = 'RESUMEN';
    row++;
    const kpiHeaderRow = row;
    sheet.getCell(`A${kpiHeaderRow}`).value = 'Métrica';
    sheet.getCell(`B${kpiHeaderRow}`).value = 'Valor';
    styleHeaderRow(kpiHeaderRow, 1, 2);
    row++;
    metrics.forEach((m, i) => {
        sheet.getCell(`A${row}`).value = m.label;
        sheet.getCell(`B${row}`).value = m.value;
        bandRow(row, 1, 2, i % 2 === 1);
        row++;
    });
    row += 2;

    // ── Ventas ──
    styleSectionTitle(row, 4);
    sheet.getCell(`A${row}`).value = 'VENTAS';
    row++;

    const ventasHeaderRow = row;
    sheet.getCell(`A${row}`).value = 'Fecha';
    sheet.getCell(`B${row}`).value = 'Ingresos';
    sheet.getCell(`C${row}`).value = '% del total';
    sheet.getCell(`D${row}`).value = 'Gráfico';
    styleHeaderRow(ventasHeaderRow, 1, 4);
    row++;

    const totalVentas = barData.reduce((s, d) => s + d.value, 0);
    const maxVentas = Math.max(...barData.map(d => d.value), 1);

    barData.forEach((d, i) => {
        sheet.getCell(`A${row}`).value = d.label;
        sheet.getCell(`B${row}`).value = d.value;
        sheet.getCell(`C${row}`).value =
            totalVentas > 0 ? `${((d.value / totalVentas) * 100).toFixed(1)}%` : '0%';
        const barCell = sheet.getCell(`D${row}`);
        barCell.value = makeTextBar(d.value, maxVentas);
        barCell.font = { name: 'Consolas', color: { argb: ACCENT_DARK } };
        bandRow(row, 1, 3, i % 2 === 1); // la col. D (gráfico) queda sin banda para no tapar el color de las barras
        row++;
    });
    row += 2;

    // ── Estados: tabla a la izquierda + gráfico a la derecha ──
    styleSectionTitle(row, 3);
    sheet.getCell(`A${row}`).value = 'PEDIDOS POR ESTADO';
    row++;

    const estadosHeaderRow = row;
    sheet.getCell(`A${row}`).value = 'Estado';
    sheet.getCell(`B${row}`).value = 'Cantidad';
    sheet.getCell(`C${row}`).value = '% del total';
    styleHeaderRow(estadosHeaderRow, 1, 3);

    if (donutImg) {
        const imgId = workbook.addImage({ base64: donutImg, extension: 'png' });
        sheet.addImage(imgId, {
            tl: { col: 3.2, row: estadosHeaderRow }, // columna F, una fila debajo del header
            ext: { width: 320, height: 260 },
        });
    }

    row++;
    const totalEstados = statusSlices.reduce((s, d) => s + d.count, 0);
    let estadosRowIdx = 0;
    statusSlices.filter(s => s.count > 0).forEach(s => {
        sheet.getCell(`A${row}`).value = STATUS_LABELS_EXPORT[s.key] ?? s.key;
        sheet.getCell(`B${row}`).value = s.count;
        sheet.getCell(`C${row}`).value =
            totalEstados > 0 ? `${((s.count / totalEstados) * 100).toFixed(1)}%` : '0%';
        bandRow(row, 1, 3, estadosRowIdx % 2 === 1);
        estadosRowIdx++;
        row++;
    });

    row = Math.max(estadosHeaderRow + 15, row) + 2;

    // ── Productos más vendidos ──
    styleSectionTitle(row, 3);
    sheet.getCell(`A${row}`).value = 'PRODUCTOS MÁS VENDIDOS';
    row++;
    const productosHeaderRow = row;
    sheet.getCell(`A${row}`).value = 'Producto';
    sheet.getCell(`B${row}`).value = 'Unidades';
    sheet.getCell(`C${row}`).value = 'Ingresos';
    styleHeaderRow(productosHeaderRow, 1, 3);
    row++;
    topProducts.forEach((p, i) => {
        sheet.getCell(`A${row}`).value = p.name;
        sheet.getCell(`B${row}`).value = p.qty;
        sheet.getCell(`C${row}`).value = `$${p.revenue.toLocaleString('es-AR')}`;
        bandRow(row, 1, 3, i % 2 === 1);
        row++;
    });
    row += 2;

    // ── Últimos pedidos del período ──
    styleSectionTitle(row, 6);
    sheet.getCell(`A${row}`).value = 'ÚLTIMOS PEDIDOS DEL PERÍODO';
    row++;
    const pedidosHeaderRow = row;
    ['N° Pedido', 'Fecha', 'Cliente', 'Total', 'Estado', 'Pago'].forEach((h, i) => {
        sheet.getCell(pedidosHeaderRow, i + 1).value = h;
    });
    styleHeaderRow(pedidosHeaderRow, 1, 6);
    row++;

    mapOrdersToRows(orders).forEach((r, i) => {
        const [id, fecha, cliente, , , total, estado, pago] = r;
        sheet.getCell(row, 1).value = id;
        sheet.getCell(row, 2).value = fecha;
        sheet.getCell(row, 3).value = cliente;
        sheet.getCell(row, 4).value = total;
        sheet.getCell(row, 5).value = estado;
        sheet.getCell(row, 6).value = pago;
        bandRow(row, 1, 6, i % 2 === 1);
        row++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    triggerDownload(blob, fileName);
}