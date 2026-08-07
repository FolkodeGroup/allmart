import { prisma } from '../config/prisma';

interface UpsertShipmentDTO {
  addressStreet: string;
  addressCity: string;
  addressProvince: string;
  addressZip: string;
  carrier?: string;
  trackingNumber?: string;
}

export async function upsertShipment(
  orderId: string,
  data: UpsertShipmentDTO
) {
  return await prisma.$transaction(async (tx) => {
    // 1️⃣ Verificar que el pedido exista
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // 2️⃣ Upsert shipment manteniendo la dirección sin alterar intencionalmente el estado del pedido
    const shipment = await tx.shipment.upsert({
      where: {
        orderId: orderId,
      },
      create: {
        orderId,
        addressStreet: data.addressStreet ?? 'Dirección no especificada',
        addressCity: data.addressCity ?? 'CABA',
        addressProvince: data.addressProvince ?? 'Buenos Aires',
        addressZip: data.addressZip ?? '1000',
        carrier: data.carrier ?? null,
        trackingNumber: data.trackingNumber ?? null,
        status: 'pendiente',
        shippedAt: data.carrier || data.trackingNumber ? new Date() : null,
      },
      update: {
        ...(data.addressStreet ? { addressStreet: data.addressStreet } : {}),
        ...(data.addressCity ? { addressCity: data.addressCity } : {}),
        ...(data.addressProvince ? { addressProvince: data.addressProvince } : {}),
        ...(data.addressZip ? { addressZip: data.addressZip } : {}),
        ...(data.carrier !== undefined ? { carrier: data.carrier } : {}),
        ...(data.trackingNumber !== undefined ? { trackingNumber: data.trackingNumber } : {}),
        ...(data.carrier || data.trackingNumber ? { shippedAt: new Date(), status: 'enviado' } : {}),
      },
    });

    return shipment;
  });
}