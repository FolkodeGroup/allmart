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

    // 2️⃣ Upsert shipment
    const shipment = await tx.shipment.upsert({
      where: {
        orderId: orderId,
      },
      create: {
        orderId,
        addressStreet: data.addressStreet,
        addressCity: data.addressCity,
        addressProvince: data.addressProvince,
        addressZip: data.addressZip,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        status: 'shipped',
        shippedAt: new Date(),
      },
      update: {
        addressStreet: data.addressStreet,
        addressCity: data.addressCity,
        addressProvince: data.addressProvince,
        addressZip: data.addressZip,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        status: 'shipped',
        shippedAt: new Date(),
      },
    });

    // 3️⃣ Actualizar estado del pedido si no está enviado
    if (order.status !== 'shipped') {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'shipped',
        },
      });
    }

    return shipment;
  });
}