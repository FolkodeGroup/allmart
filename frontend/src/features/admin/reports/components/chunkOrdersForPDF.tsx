import type { Order } from '../../../../context/AdminOrdersContext';
import type { OrdersTableProps } from '../AdminReports';

/**
 * Fragmenta la lista de pedidos en páginas A4 deterministas de 12 pedidos.
 * Esto garantiza que cada página encaje sin desbordes y sin crear raíces DOM temporales.
 */
export async function chunkOrdersForPDF(
    orders: Order[],
    _maxHeight: number,
    _tableProps: OrdersTableProps
): Promise<Order[][]> {
    if (!orders.length) return [];

    const ORDERS_PER_PAGE = 12;
    const chunks: Order[][] = [];

    for (let i = 0; i < orders.length; i += ORDERS_PER_PAGE) {
        chunks.push(orders.slice(i, i + ORDERS_PER_PAGE));
    }

    return chunks;
}