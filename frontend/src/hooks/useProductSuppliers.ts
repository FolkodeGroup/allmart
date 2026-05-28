import { useState, useEffect, useCallback } from 'react';
import {
    suppliersAdminService,
    type ProductSupplierEntry,
    type ProductPriceHistoryDetailEntry,
} from '../features/admin/suppliers/suppliersAdminService';

export function useProductSuppliers(productId: string | null) {
    const [suppliers, setSuppliers] = useState<ProductSupplierEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!productId) { setSuppliers([]); return; }
        setLoading(true);
        setError(null);
        try {
            const data = await suppliersAdminService.getProductSuppliers(productId);
            setSuppliers(data);
        } catch {
            setError('No se pudieron cargar los proveedores del producto.');
            setSuppliers([]);
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => { load(); }, [load]);

    const assign = useCallback(async (data: { supplierId: string; currentPrice: number; cost?: number; changeReason?: string }) => {
        if (!productId) return;
        await suppliersAdminService.assignSupplier(productId, data);
        await load();
    }, [productId, load]);

    const updatePrice = useCallback(async (supplierId: string, data: { price: number; cost?: number; changeReason?: string }) => {
        if (!productId) return;
        await suppliersAdminService.updateProductSupplierPrice(productId, supplierId, data);
        await load();
    }, [productId, load]);

    const remove = useCallback(async (supplierId: string) => {
        if (!productId) return;
        await suppliersAdminService.removeProductSupplier(productId, supplierId);
        await load();
    }, [productId, load]);

    const setPrimary = useCallback(async (supplierId: string) => {
        if (!productId) return;
        await suppliersAdminService.setPrimarySupplier(productId, supplierId);
        await load();
    }, [productId, load]);

    const getHistory = useCallback(async (opts: { supplierId?: string } = {}): Promise<ProductPriceHistoryDetailEntry[]> => {
        if (!productId) return [];
        return suppliersAdminService.getProductPriceHistory(productId, opts);
    }, [productId]);

    return { suppliers, loading, error, reload: load, assign, updatePrice, remove, setPrimary, getHistory };
}
