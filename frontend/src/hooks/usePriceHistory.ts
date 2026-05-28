import { useState, useEffect, useCallback } from 'react';
import { suppliersAdminService, type PriceHistoryEntry } from '../features/admin/suppliers/suppliersAdminService';

export function useSupplierPriceHistory(supplierId: string | null, opts: { startDate?: string; endDate?: string; productId?: string } = {}) {
    const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!supplierId) { setHistory([]); return; }
        setLoading(true);
        setError(null);
        try {
            const data = await suppliersAdminService.getSupplierPriceHistory(supplierId, opts);
            setHistory(data);
        } catch {
            setError('No se pudo cargar el historial de precios.');
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, [supplierId, opts.startDate, opts.endDate, opts.productId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { load(); }, [load]);

    return { history, loading, error, reload: load };
}
