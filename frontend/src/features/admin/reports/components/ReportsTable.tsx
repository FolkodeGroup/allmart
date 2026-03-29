// Tabla y paginación
import { OrdersTable } from './OrdersTable';
import { Pagination } from './Pagination';
import type { Order } from '../../../../context/AdminOrdersContext';

export interface ReportsTableProps {
    paginatedOrders: Order[];
    periodOrders: Order[];
    page: number;
    pageSize: number;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
}

/**
 * Presenta la tabla de pedidos y la paginación, sin lógica de negocio.
 */
export function ReportsTable({ paginatedOrders, periodOrders, page, pageSize, setPage, setPageSize }: ReportsTableProps) {
    return (
        <div>
            <OrdersTable orders={paginatedOrders} />
            <Pagination
                page={page}
                pageSize={pageSize}
                total={periodOrders.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[5, 10, 20, 50, 100]}
            />
        </div>
    );
}
