import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';

interface OrderConfirmationEmailItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface OrderConfirmationEmailInput {
  orderId: string;
  createdAt: Date;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: OrderConfirmationEmailItem[];
  total: number;
  notes?: string;
}

let cachedTransporter: Transporter | null = null;

function isEmailConfigured(): boolean {
  return Boolean(
    env.SMTP_HOST
      && env.SMTP_USER
      && env.SMTP_PASS
      && env.MAIL_FROM_EMAIL,
  );
}

function getTransporter(): Transporter {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return cachedTransporter;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: Date): string {
  return value.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildTextBody(input: OrderConfirmationEmailInput): string {
  const lines = input.items.map((item) => {
    const subtotal = item.unitPrice * item.quantity;
    return `- ${item.productName} x${item.quantity}: ${formatPrice(subtotal)}`;
  });

  return [
    `Hola ${input.customer.firstName},`,
    '',
    'Recibimos tu compra en Allmart.',
    '',
    `Pedido: ${input.orderId}`,
    `Fecha: ${formatDate(input.createdAt)}`,
    `Email: ${input.customer.email}`,
    `Celular: ${input.customer.phone}`,
    '',
    'Detalle:',
    ...lines,
    '',
    `Total: ${formatPrice(input.total)}`,
    input.notes ? `Notas: ${input.notes}` : '',
    '',
    `Si necesitás ayuda, escribinos por WhatsApp al +${env.ALLMART_WHATSAPP_PHONE}.`,
    'Gracias por comprar en Allmart.',
  ].filter(Boolean).join('\n');
}

function buildHtmlBody(input: OrderConfirmationEmailInput): string {
  const rows = input.items.map((item) => {
    const subtotal = item.unitPrice * item.quantity;

    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#1f2937;">${escapeHtml(item.productName)}</td>
        <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#4b5563;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#1f2937;text-align:right;">${formatPrice(subtotal)}</td>
      </tr>`;
  }).join('');

  const notesSection = input.notes
    ? `<p style="margin:16px 0 0;color:#4b5563;"><strong>Notas:</strong> ${escapeHtml(input.notes)}</p>`
    : '';

  return `
    <div style="background:#f6f4ee;padding:32px 16px;font-family:Arial,sans-serif;color:#1f2937;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="padding:28px 32px;background:#769282;color:#ffffff;">
          <div style="font-size:28px;font-weight:700;line-height:1.1;">Allmart</div>
          <p style="margin:10px 0 0;font-size:16px;opacity:0.92;">Confirmación de compra</p>
        </div>

        <div style="padding:32px;">
          <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;">Gracias por tu compra, ${escapeHtml(input.customer.firstName)}.</h1>
          <p style="margin:0 0 24px;color:#4b5563;line-height:1.6;">
            Recibimos tu pedido y ya quedó registrado en Allmart. Te compartimos el resumen completo para que lo tengas a mano.
          </p>

          <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:18px 20px;margin-bottom:24px;">
            <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
              <div>
                <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;">Pedido</div>
                <div style="font-size:16px;font-weight:700;color:#111827;">${escapeHtml(input.orderId)}</div>
              </div>
              <div>
                <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;">Fecha</div>
                <div style="font-size:16px;font-weight:700;color:#111827;">${escapeHtml(formatDate(input.createdAt))}</div>
              </div>
              <div>
                <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;">Total</div>
                <div style="font-size:20px;font-weight:700;color:#769282;">${formatPrice(input.total)}</div>
              </div>
            </div>
          </div>

          <div style="margin-bottom:24px;">
            <h2 style="margin:0 0 12px;font-size:18px;">Datos de contacto</h2>
            <p style="margin:0;color:#4b5563;line-height:1.8;">
              <strong>Cliente:</strong> ${escapeHtml(input.customer.firstName)} ${escapeHtml(input.customer.lastName)}<br />
              <strong>Email:</strong> ${escapeHtml(input.customer.email)}<br />
              <strong>Celular:</strong> ${escapeHtml(input.customer.phone)}
            </p>
          </div>

          <div>
            <h2 style="margin:0 0 12px;font-size:18px;">Detalle de tu compra</h2>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="text-align:left;padding:0 0 10px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Producto</th>
                  <th style="padding:0 0 10px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Cant.</th>
                  <th style="text-align:right;padding:0 0 10px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>

          ${notesSection}

          <div style="margin-top:28px;padding:18px 20px;background:#f0f7f4;border-radius:14px;color:#365244;line-height:1.6;">
            Si necesitás ayuda con este pedido, podés escribirnos por WhatsApp al +${escapeHtml(env.ALLMART_WHATSAPP_PHONE)}.
          </div>
        </div>
      </div>
    </div>`;
}

export async function sendOrderConfirmationEmail(input: OrderConfirmationEmailInput): Promise<'sent' | 'skipped'> {
  if (!isEmailConfigured()) {
    console.warn('[Orders] Email de confirmación omitido: faltan variables SMTP');
    return 'skipped';
  }

  const transporter = getTransporter();
  const subject = `Allmart: confirmación de tu compra ${input.orderId.slice(0, 8)}`;

  await transporter.sendMail({
    from: `${env.MAIL_FROM_NAME} <${env.MAIL_FROM_EMAIL}>`,
    to: input.customer.email,
    replyTo: env.MAIL_FROM_EMAIL,
    subject,
    text: buildTextBody(input),
    html: buildHtmlBody(input),
  });

  return 'sent';
}