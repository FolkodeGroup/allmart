/**
 * services/ordersPdfService.ts
 * Genera un PDF de reporte de pedidos con el mismo estilo visual
 * que el catálogo de productos (Puppeteer + HTML/CSS).
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const ALLMART_LOGO_SVG = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 410.87 188.52"><defs><style>.cls-1{fill:#fff;}</style></defs><path class="cls-1" d="M109.59,96.99l-21.16,22.33c-.44.46-.9.89-1.4,1.28-.53.42-1.22.94-1.71,1.24-2.37,1.44-5.04,2.16-8.03,2.16s-5.55-.69-7.3-2.06c-1.75-1.37-2.63-3.23-2.63-5.56,0-2.06.71-3.79,2.14-5.2,1.43-1.41,4.22-2.11,8.37-2.11h12.55v.07l12.11-12.81c-.07-1.63-.8-4.02-.8-4.02-.03-.09-.06-.18-.08-.26,0-.02-.02-.06-.02-.06-1.18-3.96-3.12-7.07-5.86-9.28-4.29-3.46-11.06-5.19-20.29-5.19h-15.56v10.34l16.23.11c4.43,0,7.12.09,9.06,1.11,3.44,1.8,4.78,4.3,4.98,6.05.18,1.57.23,3.3.23,4.58v.82h-13.43c-5.25,0-9.47.72-12.65,2.16-3.18,1.44-5.47,3.4-6.86,5.87-1.4,2.47-2.09,5.25-2.09,8.34s.79,5.99,2.38,8.5c1.59,2.51,3.84,4.46,6.76,5.87,2.92,1.41,6.33,2.11,10.22,2.11,4.61,0,8.42-.89,11.44-2.68,2.08-1.23,3.71-2.81,4.91-4.73v6.69h11.48v-16.47l6.99-7.4v23.87h12.16V56.24h-12.16v40.76Z"/><rect class="cls-1" x="128.87" y="56.24" width="12.16" height="76.42"/><path class="cls-1" d="M225.55,79.62c-3.21-1.71-6.89-2.57-11.04-2.57-5.13,0-9.63,1.24-13.53,3.71-2.39,1.52-4.37,3.36-5.93,5.5-1.24-2.19-2.84-4-4.83-5.4-3.6-2.54-7.83-3.81-12.7-3.81-4.28,0-8.09.93-11.43,2.78-2.22,1.23-4.08,2.85-5.6,4.84v-7h-11.58v55h12.16v-27.91c0-3.71.57-6.76,1.7-9.17,1.13-2.4,2.73-4.22,4.77-5.46,2.04-1.24,4.39-1.85,7.06-1.85,3.76,0,6.65,1.2,8.66,3.61,2.01,2.4,3.02,6.04,3.02,10.92v29.87h12.16v-27.91c0-3.71.57-6.76,1.7-9.17,1.13-2.4,2.72-4.22,4.77-5.46,2.04-1.24,4.39-1.85,7.06-1.85,3.76,0,6.65,1.2,8.66,3.61,2.01,2.4,3.02,6.04,3.02,10.92v29.87h12.16v-31.52c0-5.56-.91-10.11-2.73-13.65-1.82-3.54-4.33-6.16-7.54-7.88Z"/><path class="cls-1" d="M304.46,85.35l-.26-.27v-7.42h-11.58v19.33l-7,7.4v-.07l-14.17,15c-.44.46-.9.89-1.4,1.28-.53.42-1.22.94-1.71,1.24-2.37,1.44-5.04,2.16-8.03,2.16s-5.55-.69-7.3-2.06c-1.75-1.37-2.63-3.23-2.63-5.56,0-2.06.71-3.79,2.14-5.2,1.43-1.41,4.22-2.11,8.37-2.11h12.55s12.11-12.81,12.11-12.81c-.07-1.63-.8-3.96-.8-3.96-.03-.09-.06-.18-.08-.26,0-.02-.02-.06-.02-.06-1.18-3.96-3.12-7.07-5.86-9.28-4.29-3.46-11.06-5.19-20.29-5.19h-15.56v10.34l16.23.11c4.43,0,7.12.09,9.06,1.11,3.44,1.8,4.78,4.3,4.98,6.05.18,1.57.23,3.3.23,4.58v.82h-13.43c-5.25,0-9.47.72-12.65,2.16-3.18,1.44-5.47,3.4-6.86,5.87-1.4,2.47-2.09,5.25-2.09,8.34s.79,5.99,2.38,8.5c1.59,2.51,3.84,4.46,6.76,5.87,2.92,1.41,6.33,2.11,10.22,2.11,4.61,0,8.42-.89,11.44-2.68,2.08-1.23,3.71-2.81,4.91-4.73v6.69h11.48v-16.47l7-7.4v23.87h12.16v-26.68c0-5.63,1.36-9.87,4.09-12.72,2.73-2.85,6.39-4.27,11-4.27.45,0,.91.02,1.36.05.45.04.94.12,1.46.26v-12.26c-5,0-9.16.96-12.51,2.88-2.36,1.36-4.26,3.18-5.73,5.43Z"/><path class="cls-1" d="M351.95,120.51c-1.82,1.51-4.09,2.27-6.81,2.27-2.27,0-4.04-.72-5.3-2.16-1.27-1.44-1.9-3.47-1.9-6.08v-26.57h13.92v-10.3h-13.92v-21.28h-12.16v58.47c0,6.11,1.56,10.73,4.67,13.85,3.11,3.13,7.53,4.69,13.24,4.69,2.2,0,4.34-.31,6.42-.93,2.08-.62,3.83-1.55,5.26-2.78l-3.41-9.17Z"/></svg>`;

export interface OrderPdfItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderPdfInput {
  id: string;
  createdAt: string | Date;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  total: number;
  status: string;
  paymentStatus: string;
  items: OrderPdfItem[];
}

export interface GenerateOrdersPdfOptions {
  orders: OrderPdfInput[];
  title?: string;
  generatedAt?: Date;
  paperFormat?: 'A4' | 'Letter';
  savePath?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toSvgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-AR');
}

function formatCurrency(amount: number): string {
  return `$ ${amount.toLocaleString('es-AR')}`;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'pendiente',
    confirmed: 'confirmado',
    in_preparation: 'en-preparacion',
    'in-preparation': 'en-preparacion',
    shipped: 'enviado',
    delivered: 'entregado',
    cancelled: 'cancelado',
  };
  return labels[status] ?? status;
}

function getPaymentLabel(status: string): string {
  const labels: Record<string, string> = {
    paid: 'abonado',
    unpaid: 'no-abonado',
    refunded: 'devuelto',
  };
  return labels[status] ?? status;
}

export function buildOrdersPdfFileName(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `pedidos-todos-${year}-${month}-${day}.pdf`;
}

export function buildOrdersPdfHtml(options: {
  orders: OrderPdfInput[];
  title: string;
  generatedAt: Date;
}): string {
  const logoDataUri = toSvgDataUri(ALLMART_LOGO_SVG);
  const generatedDate = formatDate(options.generatedAt);

  const tableRows = options.orders
    .map((order) => {
      const productsList = order.items
        .map((i) => escapeHtml(`${i.productName} x${i.quantity}`))
        .join('<br/>');
      return `
    <tr>
      <td class="col-id">${escapeHtml(order.id.slice(0, 8).toUpperCase())}</td>
      <td class="col-date">${escapeHtml(formatDate(order.createdAt))}</td>
      <td class="col-customer">${escapeHtml(`${order.customerFirstName} ${order.customerLastName}`)}</td>
      <td class="col-email">${escapeHtml(order.customerEmail)}</td>
      <td class="col-products">${productsList}</td>
      <td class="col-total">${escapeHtml(formatCurrency(order.total))}</td>
      <td class="col-status">${escapeHtml(getStatusLabel(order.status))}</td>
      <td class="col-payment">${escapeHtml(getPaymentLabel(order.paymentStatus))}</td>
    </tr>`;
    })
    .join('');

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          :root {
            --brand-primary: #769282;
            --brand-primary-dark: #5d7568;
            --brand-primary-light: #8fa99a;
            --brand-accent: #DDB08C;
            --brand-accent-dark: #c89a70;
            --brand-background: #F2EFEB;
            --brand-surface: #FFFFFF;
            --brand-border: #E5E2DD;
            --brand-text: #1A1A1A;
            --brand-text-muted: #767676;
            --font-heading: 'Montserrat', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            --font-body: 'Merriweather', Georgia, 'Times New Roman', serif;
          }
          * { box-sizing: border-box; }
          html, body {
            margin: 0; padding: 0;
            color: var(--brand-text);
            background: var(--brand-background);
            font-family: var(--font-body);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .report-shell { padding: 5mm; }
          .report-hero {
            background: linear-gradient(135deg, var(--brand-primary-dark), var(--brand-primary));
            border-radius: 18px;
            color: #fff;
            display: grid;
            gap: 10px;
            grid-template-columns: 112px 1fr;
            padding: 18px 22px;
            align-items: center;
            box-shadow: 0 18px 32px rgba(93,117,104,0.14);
          }
          .report-hero__logo { max-width: 100%; display: block; }
          .report-hero__eyebrow {
            font: 600 11px/1.2 var(--font-heading);
            letter-spacing: 0.18em;
            margin: 0 0 8px;
            opacity: 0.74;
            text-transform: uppercase;
          }
          .report-hero__title {
            font: 700 28px/1.05 var(--font-heading);
            letter-spacing: -0.02em;
            margin: 0;
          }
          .report-hero__subtitle {
            font: 400 13px/1.55 var(--font-body);
            margin: 10px 0 0;
            opacity: 0.85;
          }
          .report-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 10mm;
            background: var(--brand-surface);
            border-radius: 14px;
            box-shadow: 0 8px 24px rgba(26,26,26,0.07);
            overflow: hidden;
          }
          .report-table th, .report-table td {
            padding: 5px 7px;
            border-bottom: 1px solid var(--brand-border);
            vertical-align: top;
            text-align: left;
            font-size: 8.5pt;
          }
          .report-table th {
            background: var(--brand-primary);
            color: #fff;
            font: 700 9pt var(--font-heading);
            letter-spacing: 0.01em;
            border-bottom: 2px solid var(--brand-primary-dark);
            padding-top: 7px;
            padding-bottom: 7px;
            vertical-align: middle;
          }
          .report-table tr:last-child td { border-bottom: none; }
          .report-table tr:nth-child(even) td {
            background: #f5faf9;
          }
          .col-id {
            font: 600 8pt var(--font-heading);
            color: var(--brand-primary-dark);
            white-space: nowrap;
            width: 58px;
          }
          .col-date {
            white-space: nowrap;
            width: 56px;
            color: var(--brand-text-muted);
          }
          .col-customer {
            font: 600 8.5pt var(--font-heading);
            color: var(--brand-text);
            width: 80px;
          }
          .col-email {
            color: var(--brand-text-muted);
            font-size: 7.5pt;
            word-break: break-all;
            width: 110px;
          }
          .col-products {
            color: var(--brand-primary-dark);
            font-size: 8pt;
            line-height: 1.55;
          }
          .col-total {
            font: 700 9pt var(--font-heading);
            color: var(--brand-accent-dark);
            white-space: nowrap;
            width: 70px;
          }
          .col-status {
            width: 70px;
          }
          .col-payment {
            width: 62px;
          }
          @media print { .report-shell { padding: 0; } }
        </style>
      </head>
      <body>
        <main class="report-shell">
          <section class="report-hero" aria-label="Encabezado del reporte">
            <img class="report-hero__logo" src="${logoDataUri}" alt="Logo de Allmart" />
            <div>
              <p class="report-hero__eyebrow">Allmart</p>
              <h1 class="report-hero__title">${escapeHtml(options.title)}</h1>
              <p class="report-hero__subtitle">Generado: ${escapeHtml(generatedDate)}</p>
            </div>
          </section>
          <section aria-label="Listado de pedidos">
            <table class="report-table">
              <thead>
                <tr>
                  <th>N° Pedido</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Email</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Pago</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </section>
        </main>
      </body>
    </html>
  `;
}

export function buildOrdersReportHeaderTemplate(title: string): string {
  return `
    <div style="width:100%;padding:6mm 12mm 0;font-family:Arial,sans-serif;color:#5d7568;font-size:9px;display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="display:inline-block;width:10px;height:10px;border-radius:999px;background:#769282;"></span>
        <span style="font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Allmart</span>
      </div>
      <span>${title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
    </div>
  `;
}

export function buildOrdersReportFooterTemplate(): string {
  return `
    <div style="width:100%;padding:0 12mm 6mm;font-family:Arial,sans-serif;color:#767676;font-size:9px;display:flex;align-items:center;justify-content:space-between;">
      <span>Allmart — Reporte de Pedidos</span>
      <span>Pagina <span class="pageNumber"></span> de <span class="totalPages"></span></span>
    </div>
  `;
}

export async function generateOrdersPdf(
  options: GenerateOrdersPdfOptions,
): Promise<{ buffer: Buffer; fileName: string }> {
  const title = options.title ?? 'Reporte de Pedidos';
  const generatedAt = options.generatedAt ?? new Date();
  const fileName = buildOrdersPdfFileName(generatedAt);

  const html = buildOrdersPdfHtml({
    orders: options.orders,
    title,
    generatedAt,
  });

  const puppeteerModule = await import('puppeteer');
  const puppeteer = puppeteerModule.default ?? puppeteerModule;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.emulateMediaType('screen');
    await page.setContent(html, { waitUntil: 'load' });

    const pdfBytes = await page.pdf({
      format: options.paperFormat ?? 'A4',
      landscape: true,
      displayHeaderFooter: true,
      headerTemplate: buildOrdersReportHeaderTemplate(title),
      footerTemplate: buildOrdersReportFooterTemplate(),
      margin: {
        top: '18mm',
        right: '12mm',
        bottom: '16mm',
        left: '12mm',
      },
      printBackground: true,
      preferCSSPageSize: false,
      scale: 1,
      tagged: true,
    });

    const buffer = Buffer.from(pdfBytes);

    if (options.savePath) {
      await mkdir(dirname(options.savePath), { recursive: true });
      await writeFile(options.savePath, buffer);
    }

    return { buffer, fileName };
  } finally {
    await browser.close();
  }
}
