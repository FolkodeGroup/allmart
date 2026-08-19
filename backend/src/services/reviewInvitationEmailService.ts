import nodemailer, { type Transporter } from 'nodemailer';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';

export interface ReviewTokenPayload {
  orderId: string;
  productId: string;
  customerEmail: string;
  customerName: string;
  iat?: number;
  exp?: number;
}

interface ReviewEmailProduct {
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string | null;
  unitPrice: number;
}

export interface ReviewInvitationEmailInput {
  orderId: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  items: ReviewEmailProduct[];
}

let cachedTransporter: Transporter | null = null;

function isEmailConfigured(): boolean {
  return Boolean(
    env.SMTP_HOST &&
      env.SMTP_USER &&
      env.SMTP_PASS &&
      env.MAIL_FROM_EMAIL
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

export function generateReviewToken(payload: Omit<ReviewTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '30d' });
}

export function verifyReviewToken(token: string): ReviewTokenPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as ReviewTokenPayload;
  } catch {
    throw Object.assign(new Error('El enlace de invitación para opinar es inválido o ha expirado'), {
      statusCode: 400,
    });
  }
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

function formatPrice(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value);
}

function buildReviewEmailHtml(
  customerName: string,
  orderId: string,
  productsWithLinks: Array<{
    productName: string;
    unitPrice: number;
    productImage?: string | null;
    reviewUrl: string;
  }>
): string {
  const orderCode = formatOrderCode(orderId);

  const productCardsHtml = productsWithLinks
    .map((item) => {
      const imageTag = item.productImage
        ? `<img src="${escapeHtml(item.productImage)}" alt="${escapeHtml(
            item.productName
          )}" width="64" height="64" style="display:block;border-radius:10px;object-fit:cover;border:1px solid #e5e7eb;background-color:#ffffff;" />`
        : `<div style="width:64px;height:64px;border-radius:10px;background-color:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:24px;border:1px solid #e5e7eb;text-align:center;line-height:64px;">📦</div>`;

      return `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:16px;background-color:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:16px 18px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="72" valign="top" style="padding-right:12px;">
                    ${imageTag}
                  </td>
                  <td valign="middle">
                    <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:16px;line-height:22px;font-weight:700;color:#1f2937;">
                      ${escapeHtml(item.productName)}
                    </p>
                    <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:20px;color:#769282;font-weight:600;">
                      ${formatPrice(item.unitPrice)}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:14px;">
                    <a href="${escapeHtml(item.reviewUrl)}" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;background-color:#769282;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:8px;box-sizing:border-box;">
                      ★ Dejar mi opinión sobre este producto
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>¿Qué te pareció tu producto en Allmart?</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f6f4ee;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f6f4ee">
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:640px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:24px;overflow:hidden;">
                <tr>
                  <td bgcolor="#769282" style="padding:24px 24px 20px;border-radius:24px 24px 0 0;">
                    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;line-height:18px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#eff7f2;">Allmart</p>
                    <p style="margin:10px 0 0;font-family:Arial,sans-serif;font-size:28px;line-height:32px;font-weight:700;color:#ffffff;">¿Qué te pareció tu compra?</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 24px 32px;">
                    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:16px;line-height:24px;color:#64748b;">¡Hola, ${escapeHtml(customerName)}!</p>
                    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:16px;line-height:24px;color:#334155;">
                      Tu pedido <strong>#${escapeHtml(orderCode)}</strong> fue entregado con éxito. Tu opinión es muy importante para ayudarnos a mejorar y guiar a otros compradores de la comunidad Allmart.
                    </p>

                    <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:14px;line-height:20px;font-weight:700;color:#1f2937;text-transform:uppercase;letter-spacing:0.5px;">
                      Productos de tu pedido para valorar:
                    </p>

                    ${productCardsHtml}

                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:24px;background-color:#f0f7f4;border-radius:14px;">
                      <tr>
                        <td style="padding:16px 20px;font-family:Arial,sans-serif;font-size:13px;line-height:20px;color:#365244;">
                          <strong>Compra 100% Verificada:</strong> Al acceder desde los botones de este correo tu reseña se publicará automáticamente con el sello de comprador verificado sin necesidad de ingresar contraseñas ni números de pedido.
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
    </html>
  `;
}

export async function sendReviewInvitationEmail(input: ReviewInvitationEmailInput): Promise<'sent' | 'skipped'> {
  if (!isEmailConfigured()) {
    console.warn('[Reviews] Email de invitación a opinar omitido: faltan variables SMTP');
    return 'skipped';
  }

  const customerFullName = `${input.customer.firstName} ${input.customer.lastName}`.trim() || input.customer.firstName;
  const baseUrl = env.FRONTEND_URL.replace(/\/$/, '');

  const productsWithLinks = input.items.map((item) => {
    const token = generateReviewToken({
      orderId: input.orderId,
      productId: item.productId,
      customerEmail: input.customer.email,
      customerName: customerFullName,
    });

    const reviewUrl = `${baseUrl}/producto/${encodeURIComponent(item.productSlug)}?review_token=${encodeURIComponent(token)}`;

    return {
      productName: item.productName,
      unitPrice: item.unitPrice,
      productImage: item.productImage,
      reviewUrl,
    };
  });

  const transporter = getTransporter();
  const subject = `Allmart: ¿Qué te pareció tu compra? (Pedido #${formatOrderCode(input.orderId)})`;

  const html = buildReviewEmailHtml(customerFullName, input.orderId, productsWithLinks);

  await transporter.sendMail({
    from: `${env.MAIL_FROM_NAME} <${env.MAIL_FROM_EMAIL}>`,
    to: input.customer.email,
    replyTo: env.MAIL_FROM_EMAIL,
    subject,
    html,
  });

  console.log(`[Reviews] Email de invitación enviado con éxito a: ${input.customer.email}`);
  return 'sent';
}

export async function triggerReviewInvitationsForOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              productImages: { select: { id: true }, orderBy: { position: 'asc' }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!order || !order.customerEmail) return;

  const validProducts: ReviewEmailProduct[] = [];
  const seenIds = new Set<string>();

  for (const item of order.orderItems) {
    if (!item.productId || !item.product) continue;
    if (seenIds.has(item.productId)) continue;
    seenIds.add(item.productId);

    let imageUrl: string | null = null;
    if (item.product.productImages && item.product.productImages.length > 0) {
      imageUrl = `/api/images/products/${item.product.productImages[0].id}`;
    }

    validProducts.push({
      productId: item.product.id,
      productName: item.productName || item.product.name,
      productSlug: item.product.slug,
      productImage: imageUrl,
      unitPrice: Number(item.unitPrice),
    });
  }

  if (validProducts.length === 0) return;

  await sendReviewInvitationEmail({
    orderId: order.id,
    customer: {
      firstName: order.customerFirstName,
      lastName: order.customerLastName,
      email: order.customerEmail,
    },
    items: validProducts,
  });
}