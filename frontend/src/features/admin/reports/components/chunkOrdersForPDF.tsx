import { createRoot } from 'react-dom/client';
import { OrdersTable } from './OrdersTable';
import type { Order } from '../../../../context/AdminOrdersContext';
import type { OrdersTableProps } from '../AdminReports';

/**
 * Chunk orders for PDF export, measuring real DOM height.
 * @param orders Array of orders
 * @param maxHeight Max height per page (px)
 * @param tableProps Props to pass to OrdersTable
 * @returns Promise<Order[][]>
 */
export async function chunkOrdersForPDF(
    orders: Order[],
    maxHeight: number,
    tableProps: OrdersTableProps
): Promise<Order[][]> {
    if (!orders.length) return [];

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.width = '900px';
    tempContainer.style.zIndex = '-1';
    document.body.appendChild(tempContainer);

    const wrapper = document.createElement('div');
    tempContainer.appendChild(wrapper);
    const root = createRoot(wrapper);

    let currentChunk: Order[] = [];
    const chunks: Order[][] = [];

    for (const order of orders) {
        const testChunk: Order[] = [...currentChunk, order];
        root.render(
            <OrdersTable {...tableProps} orders={testChunk} />
        );
        // Wait for DOM update
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        const height = wrapper.offsetHeight;
        if (height > maxHeight) {
            if (currentChunk.length > 0) chunks.push(currentChunk);
            currentChunk = [order];
        } else {
            currentChunk = testChunk;
        }
    }
    if (currentChunk.length) chunks.push(currentChunk);
    root.unmount();
    document.body.removeChild(tempContainer);
    return chunks;
}