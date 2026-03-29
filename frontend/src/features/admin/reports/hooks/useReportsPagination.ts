// Encapsula la lógica de paginación y reset al cambiar filtros o tamaño.
import { useState, useEffect } from 'react';

/**
 * Maneja el estado de paginación y resetea la página cuando cambia el tamaño o el total.
 */
export function useReportsPagination(total: number, defaultPageSize = 10) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    useEffect(() => { setPage(1); }, [pageSize, total]);

    return { page, setPage, pageSize, setPageSize };
}
