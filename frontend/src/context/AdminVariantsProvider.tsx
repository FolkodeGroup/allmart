/**
 * context/AdminVariantsProvider.tsx
 * Provider component for AdminVariantsContext.
 */

import { useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import { useNotification } from './index';
import { AdminVariantsContext, apiToVariantGroup } from './AdminVariantsContext';
import * as variantsService from '../features/admin/variants/variantsService';
import type { VariantChild } from '../features/admin/variants/variantsService';
import type { VariantGroup } from './AdminVariantsContext';

export function AdminVariantsProvider({ children }: { children: ReactNode }) {
  const { token } = useAdminAuth();
  const { showNotification } = useNotification();
  const [variants, setVariants] = useState<VariantGroup[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skus, setSkus] = useState<VariantChild[]>([]);

  const requireToken = useCallback(() => {
    if (!token) throw new Error('No hay sesión activa');
    return token;
  }, [token]);

  const withLoading = useCallback(async function <T>(fn: () => Promise<T>, successMsg?: string): Promise<T> {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fn();
      if (successMsg) showNotification('success', successMsg);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setError(msg);
      showNotification('error', msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  const loadVariants = useCallback(async (productId: string) => {
    await withLoading(async () => {
      const t = requireToken();
      const data = await variantsService.fetchVariantsByProduct(t, productId);
      setVariants(data.map(apiToVariantGroup));
      setSelectedProductId(productId);
    }).catch(() => {
      setVariants([]);
      setSelectedProductId(null);
    });
  }, [requireToken, withLoading]);

  const loadSkus = useCallback(async (productId: string) => {
    await withLoading(async () => {
      const t = requireToken();
      const data = await variantsService.fetchVariantChildren(t, productId);
      setSkus(data);
    }).catch(() => setSkus([]));
  }, [requireToken, withLoading]);

  const clearVariants = useCallback(() => {
    setVariants([]);
    setSelectedProductId(null);
    setError(null);
  }, []);

  const addVariant = useCallback(async (productId: string, name: string, values: string[] = []): Promise<VariantGroup> => {
    return withLoading(async () => {
      const t = requireToken();
      const created = await variantsService.createVariant(t, productId, { name, values });
      const group = apiToVariantGroup(created);
      setVariants(prev => [...prev, group]);
      return group;
    }, 'Grupo de variantes creado');
  }, [requireToken, withLoading]);

  const updateVariant = useCallback(async (
    productId: string,
    variantId: string,
    data: { name?: string; values?: string[] },
  ) => {
    await withLoading(async () => {
      const t = requireToken();
      const updated = await variantsService.updateVariant(t, productId, variantId, data);
      setVariants(prev =>
        prev.map(v => (v.id === variantId ? apiToVariantGroup(updated) : v)),
      );
    }, 'Variantes actualizadas');
  }, [requireToken, withLoading]);

  const deleteVariant = useCallback(async (productId: string, variantId: string) => {
    await withLoading(async () => {
      const t = requireToken();
      await variantsService.deleteVariant(t, productId, variantId);
      setVariants(prev => prev.filter(v => v.id !== variantId));
    }, 'Grupo de variantes eliminado');
  }, [requireToken, withLoading]);

  const toggleVariantStatus = useCallback(async (productId: string, variantId: string, newStatus: boolean) => {
    const statusLabel = newStatus ? 'activada' : 'desactivada';
    await withLoading(async () => {
      const t = requireToken();
      const updated = await variantsService.updateVariant(t, productId, variantId, { isActive: newStatus });
      setVariants(prev =>
        prev.map(v => (v.id === variantId ? apiToVariantGroup(updated) : v)),
      );
    }, `Variante ${statusLabel} correctamente`);
  }, [requireToken, withLoading]);

  const addValueToVariant = useCallback(async (productId: string, variantId: string, value: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;
    if (variant.values.includes(value)) return;
    const newValues = [...variant.values, value];
    await updateVariant(productId, variantId, { values: newValues });
  }, [variants, updateVariant]);

  const removeValueFromVariant = useCallback(async (productId: string, variantId: string, value: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;
    const newValues = variant.values.filter(v => v !== value);
    await updateVariant(productId, variantId, { values: newValues });
  }, [variants, updateVariant]);

  const createVariantChild = useCallback(async (productId: string, payload: { sku?: string; attributes: Record<string, string>; stock?: number; images?: string[]; price?: number; criticalStockThreshold?: number }) => {
    // 🟢 FIX: Omitimos el successMsg aquí para que el Toast solo salga desde TabVariantes.tsx (donde controlamos el estado Optimista)
    return withLoading(async () => {
      const t = requireToken();
      const created = await variantsService.createVariantChild(t, productId, payload);
      try {
        const data = await variantsService.fetchVariantsByProduct(t, productId);
        setVariants(data.map(apiToVariantGroup));
        await loadSkus(productId);
      } catch {
        // ignore refresh errors
      }
      return created;
    });
  }, [loadSkus, requireToken, withLoading]);

  const updateVariantChild = useCallback(async (productId: string, skuId: string, payload: { sku?: string; attributes?: Record<string, string>; stock?: number; images?: string[]; price?: number; criticalStockThreshold?: number }) => {
    // 🟢 FIX: Omitimos el successMsg aquí también
    return withLoading(async () => {
      const t = requireToken();
      const updated = await variantsService.updateVariantChild(
        t, productId, skuId,
        payload as typeof payload & { attributes: Record<string, string> },
      );
      await loadSkus(productId);
      return updated;
    });
  }, [loadSkus, requireToken, withLoading]);

  const deleteVariantChild = useCallback(async (productId: string, skuId: string) => {
    // 🟢 FIX: Omitimos el successMsg aquí también
    return withLoading(async () => {
      const t = requireToken();
      await variantsService.deleteVariantChild(t, productId, skuId);
      await loadSkus(productId);
    });
  }, [loadSkus, requireToken, withLoading]);

  const providerValue = useMemo(() => ({
    variants,
    selectedProductId,
    isLoading,
    error,
    loadVariants,
    clearVariants,
    addVariant,
    updateVariant,
    deleteVariant,
    toggleVariantStatus,
    addValueToVariant,
    removeValueFromVariant,
    skus,
    loadSkus,
    createVariantChild,
    updateVariantChild,
    deleteVariantChild,
  }), [
    variants,
    selectedProductId,
    isLoading,
    error,
    loadVariants,
    clearVariants,
    addVariant,
    updateVariant,
    deleteVariant,
    toggleVariantStatus,
    addValueToVariant,
    removeValueFromVariant,
    skus,
    loadSkus,
    createVariantChild,
    updateVariantChild,
    deleteVariantChild,
  ]);

  return (
    <AdminVariantsContext.Provider value={providerValue}>
      {children}
    </AdminVariantsContext.Provider>
  );
}