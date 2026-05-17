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

function formatOrderCode(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}

function formatOrderLabel(orderId: string): string {
  return `Pedido #${formatOrderCode(orderId)}`;
}

function buildTextBody(input: OrderConfirmationEmailInput): string {
  const orderLabel = formatOrderLabel(input.orderId);
  const lines = input.items.map((item) => {
    const subtotal = item.unitPrice * item.quantity;
    return `- ${item.productName}: ${item.quantity} x ${formatPrice(item.unitPrice)} = ${formatPrice(subtotal)}`;
  });

  return [
    `Hola ${input.customer.firstName},`,
    '',
    'Recibimos tu compra en Allmart.',
    '',
    `Numero de pedido: ${orderLabel}`,
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
  const orderLabel = formatOrderLabel(input.orderId);
  const preheader = `Confirmamos ${orderLabel} por ${formatPrice(input.total)}.`;
  const rows = input.items.map((item) => {
    const subtotal = item.unitPrice * item.quantity;

    return `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #e5e7eb;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="font-family:Arial,sans-serif;font-size:16px;line-height:22px;font-weight:700;color:#1f2937;">
                ${escapeHtml(item.productName)}
              </td>
              <td align="right" style="font-family:Arial,sans-serif;font-size:16px;line-height:22px;font-weight:700;color:#1f2937;white-space:nowrap;">
                ${formatPrice(subtotal)}
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top:6px;font-family:Arial,sans-serif;font-size:14px;line-height:20px;color:#64748b;">
                ${item.quantity} x ${formatPrice(item.unitPrice)}
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }).join('');

  const notesSection = input.notes
    ? `
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:24px;">
        <tr>
          <td style="padding:16px 18px;background-color:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;font-family:Arial,sans-serif;font-size:14px;line-height:22px;color:#475569;">
            <strong style="color:#1f2937;">Notas:</strong> ${escapeHtml(input.notes)}
          </td>
        </tr>
      </table>`
    : '';

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <title>Confirmación de compra</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f6f4ee;">
        <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;color:transparent;">
          ${escapeHtml(preheader)}
        </div>

        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f6f4ee">
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:640px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:24px;overflow:hidden;">
                <tr>
                  <td bgcolor="#769282" style="padding:24px 24px 20px;border-radius:24px 24px 0 0;">
                    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;line-height:18px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#eff7f2;">Allmart</p>
                    <p style="margin:10px 0 0;font-family:Arial,sans-serif;font-size:28px;line-height:32px;font-weight:700;color:#ffffff;">Confirmación de compra</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:28px 24px 32px;">
                    <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:16px;line-height:24px;color:#64748b;">Gracias por tu compra,</p>
                    <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:32px;line-height:38px;font-weight:700;color:#1f2937;">${escapeHtml(input.customer.firstName)}.</p>
                    <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:16px;line-height:24px;color:#475569;">
                      Recibimos tu pedido y ya quedó registrado en Allmart. Te compartimos el resumen completo para que lo tengas a mano.
                    </p>

                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:16px;background-color:#f8fafc;margin-bottom:24px;">
                      <tr>
                        <td style="padding:18px 20px;border-bottom:1px solid #e5e7eb;">
                          <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:12px;line-height:16px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;">Número de pedido</p>
                          <p style="margin:0;font-family:Arial,sans-serif;font-size:22px;line-height:28px;font-weight:700;color:#1f2937;">${escapeHtml(orderLabel)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:18px 20px;border-bottom:1px solid #e5e7eb;">
                          <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:12px;line-height:16px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;">Fecha</p>
                          <p style="margin:0;font-family:Arial,sans-serif;font-size:16px;line-height:24px;font-weight:700;color:#1f2937;">${escapeHtml(formatDate(input.createdAt))}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:18px 20px;">
                          <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:12px;line-height:16px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;">Total</p>
                          <p style="margin:0;font-family:Arial,sans-serif;font-size:24px;line-height:30px;font-weight:700;color:#769282;">${formatPrice(input.total)}</p>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="padding-bottom:12px;font-family:Arial,sans-serif;font-size:20px;line-height:28px;font-weight:700;color:#1f2937;">Datos de contacto</td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="padding:6px 0;width:110px;font-family:Arial,sans-serif;font-size:14px;line-height:22px;font-weight:700;color:#475569;">Cliente</td>
                              <td style="padding:6px 0;font-family:Arial,sans-serif;font-size:14px;line-height:22px;color:#64748b;">${escapeHtml(input.customer.firstName)} ${escapeHtml(input.customer.lastName)}</td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;width:110px;font-family:Arial,sans-serif;font-size:14px;line-height:22px;font-weight:700;color:#475569;">Email</td>
                              <td style="padding:6px 0;font-family:Arial,sans-serif;font-size:14px;line-height:22px;color:#64748b;">${escapeHtml(input.customer.email)}</td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;width:110px;font-family:Arial,sans-serif;font-size:14px;line-height:22px;font-weight:700;color:#475569;">Celular</td>
                              <td style="padding:6px 0;font-family:Arial,sans-serif;font-size:14px;line-height:22px;color:#64748b;">${escapeHtml(input.customer.phone)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom:12px;font-family:Arial,sans-serif;font-size:20px;line-height:28px;font-weight:700;color:#1f2937;">Detalle de tu compra</td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                            ${rows}
                            <tr>
                              <td style="padding-top:16px;">
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;">
                                  <tr>
                                    <td style="padding:16px 18px;font-family:Arial,sans-serif;font-size:15px;line-height:22px;font-weight:700;color:#475569;">Total abonado</td>
                                    <td align="right" style="padding:16px 18px;font-family:Arial,sans-serif;font-size:20px;line-height:26px;font-weight:700;color:#769282;white-space:nowrap;">${formatPrice(input.total)}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    ${notesSection}

                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                      <tr>
                        <td style="padding:18px 20px;background-color:#f0f7f4;border-radius:14px;font-family:Arial,sans-serif;font-size:14px;line-height:22px;color:#365244;">
                          Si necesitás ayuda con este pedido, podés escribirnos por WhatsApp al +${escapeHtml(env.ALLMART_WHATSAPP_PHONE)}.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>`;
}

export async function sendOrderConfirmationEmail(input: OrderConfirmationEmailInput): Promise<'sent' | 'skipped'> {
  if (!isEmailConfigured()) {
    console.warn('[Orders] Email de confirmación omitido: faltan variables SMTP');
    return 'skipped';
  }

  const transporter = getTransporter();
  const subject = `Allmart: confirmación de tu compra - ${formatOrderLabel(input.orderId)}`;

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