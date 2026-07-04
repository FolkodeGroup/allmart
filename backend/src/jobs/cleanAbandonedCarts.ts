/**
 * jobs/cleanAbandonedCarts.ts
 * Tarea en segundo plano para purgar carritos de compra que han estado
 * inactivos por más del período de tiempo establecido.
 */

import { prisma } from '../config/prisma';

/**
 * Elimina carritos inactivos cuya fecha de última actualización ('updatedAt')
 * supere los días indicados por el parámetro de antigüedad (por defecto 14 días).
 *
 * @param daysInactivity Días máximos de inactividad tolerados antes de considerar el carrito como abandonado.
 * @returns Número de registros de carritos eliminados de la base de datos.
 */
export async function cleanAbandonedCarts(daysInactivity = 14): Promise<number> {
  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysInactivity);

    console.log(`[Job][Carts] Iniciando purga de carritos inactivos desde: ${thresholdDate.toISOString()}`);

    // La relación en schema.prisma tiene onDelete: Cascade, por lo que eliminar el Cart
    // elimina de forma automática y atómica sus respectivos CartItems.
    const result = await prisma.cart.deleteMany({
      where: {
        updatedAt: {
          lt: thresholdDate,
        },
      },
    });

    console.log(`[Job][Carts] Purga completada. Se eliminaron ${result.count} carritos inactivos.`);
    return result.count;
  } catch (error) {
    console.error('[Job][Carts] Error al ejecutar la limpieza de carritos abandonados:', error);
    throw error;
  }
}