/**
 * context/AdminVariantsContext.tsx
 * Contexto para gestión de variantes de producto en el panel admin.
 * Consume la API REST del backend — sin mocks ni localStorage.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import * as variantsService from '../services/variantsService';
import type { ApiVariant } from '../services/variantsService';

// ─── Tipos exportados ─────────────────────────────────────────────────────────

/** Variante de producto en el frontend (alias limpio de ApiVariant) */
export interface VariantGroup {
  id: string;
  productId: string;
  name: string;
  values: string[];
}

interface AdminVariantsContextType {
  /** Variantes del producto actualmente seleccionado */
  variants: VariantGroup[];
  /** ID del producto cuyas variantes están cargadas */
  selectedProductId: string | null;
  isLoading: boolean;
  error: string | null;

  /** Carga las variantes de un producto desde la API */
  loadVariants: (productId: string) => Promise<void>;
  /** Limpia las variantes del estado (al deseleccionar un producto) */
  clearVariants: () => void;

  /** Crea un grupo de variantes nuevo */
  addVariant: (productId: string, name: string, values?: string[]) => Promise<VariantGroup>;
  /** Actualiza el nombre o los valores de un grupo */
  updateVariant: (productId: string, variantId: string, data: { name?: string; values?: string[] }) => Promise<void>;
  /** Elimina un grupo completo */
  deleteVariant: (productId: string, variantId: string) => Promise<void>;

  /** Agrega un valor a un grupo existente */
  addValueToVariant: (productId: string, variantId: string, value: string) => Promise<void>;
  /** Elimina un valor de un grupo existente */
  removeValueFromVariant: (productId: string, variantId: string, value: string) => Promise<void>;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const AdminVariantsContext = createContext<AdminVariantsContextType | undefined>(undefined);

// ─── Helper de mapeo ──────────────────────────────────────────────────────────

function apiToVariantGroup(api: ApiVariant): VariantGroup {
  return {
    id: api.id,
    productId: api.productId,
    name: api.name,
    values: Array.isArray(api.values) ? api.values : [],
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AdminVariantsProvider({ children }: { children: ReactNode }) {
  const { token } = useAdminAuth();
  const [variants, setVariants] = useState<VariantGroup[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function requireToken(): string {
    if (!token) throw new Error('No hay sesión activa');
    return token;
  }

  async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
    setIsLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Operaciones ────────────────────────────────────────────────────────────

  const loadVariants = useCallback(async (productId: string) => {
    await withLoading(async () => {
      const t = requireToken();
      const data = await variantsService.fetchVariantsByProduct(t, productId);
      setVariants(data.map(apiToVariantGroup));
      setSelectedProductId(productId);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const clearVariants = useCallback(() => {
    setVariants([]);
    setSelectedProductId(null);
    setError(null);
  }, []);

  const addVariant = async (productId: string, name: string, values: string[] = []): Promise<VariantGroup> => {
    return withLoading(async () => {
      const t = requireToken();
      const created = await variantsService.createVariant(t, productId, { name, values });
      const group = apiToVariantGroup(created);
      setVariants(prev => [...prev, group]);
      return group;
    });
  };

  const updateVariant = async (
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
    });
  };

  const deleteVariant = async (productId: string, variantId: string) => {
    await withLoading(async () => {
      const t = requireToken();
      await variantsService.deleteVariant(t, productId, variantId);
      setVariants(prev => prev.filter(v => v.id !== variantId));
    });
  };

  const addValueToVariant = async (productId: string, variantId: string, value: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;
    if (variant.values.includes(value)) return; // evitar duplicados
    const newValues = [...variant.values, value];
    await updateVariant(productId, variantId, { values: newValues });
  };

  const removeValueFromVariant = async (productId: string, variantId: string, value: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;
    const newValues = variant.values.filter(v => v !== value);
    await updateVariant(productId, variantId, { values: newValues });
  };

  return (
    <AdminVariantsContext.Provider
      value={{
        variants,
        selectedProductId,
        isLoading,
        error,
        loadVariants,
        clearVariants,
        addVariant,
        updateVariant,
        deleteVariant,
        addValueToVariant,
        removeValueFromVariant,
      }}
    >
      {children}
    </AdminVariantsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdminVariants() {
  const ctx = useContext(AdminVariantsContext);
  if (!ctx) throw new Error('useAdminVariants debe usarse dentro de AdminVariantsProvider');
  return ctx;
}
