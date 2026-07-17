/**
 * context/AdminVariantsContext.tsx
 * Contexto para gestión de variantes de producto en el panel admin.
 * Consume la API REST del backend — sin mocks ni localStorage.
 */

import { createContext, useContext } from 'react';
import type { ApiVariant, VariantChild } from '../features/admin/variants/variantsService';

export interface VariantGroup {
  id: string;
  productId: string;
  name: string;
  values: string[];
  isActive: boolean;
}

export type VariantGroupsGridProps = {
  groups: VariantGroup[];
  onDuplicate: (group: VariantGroup) => void;
};

interface AdminVariantsContextType {
  variants: VariantGroup[];
  selectedProductId: string | null;
  isLoading: boolean;
  error: string | null;

  loadVariants: (productId: string) => Promise<void>;
  clearVariants: () => void;

  addVariant: (productId: string, name: string, values?: string[]) => Promise<VariantGroup>;
  updateVariant: (productId: string, variantId: string, data: { name?: string; values?: string[] }) => Promise<void>;
  deleteVariant: (productId: string, variantId: string) => Promise<void>;
  toggleVariantStatus: (productId: string, variantId: string, newStatus: boolean) => Promise<void>;

  addValueToVariant: (productId: string, variantId: string, value: string) => Promise<void>;
  removeValueFromVariant: (productId: string, variantId: string, value: string) => Promise<void>;
  skus: VariantChild[];
  loadSkus: (productId: string) => Promise<void>;
  createVariantChild: (productId: string, payload: { sku?: string; attributes: Record<string, string>; stock?: number; images?: string[]; price?: number; criticalStockThreshold?: number }) => Promise<unknown>;
  updateVariantChild: (productId: string, skuId: string, payload: { sku?: string; attributes?: Record<string, string>; stock?: number; images?: string[]; price?: number; criticalStockThreshold?: number }) => Promise<VariantChild>;
  deleteVariantChild: (productId: string, skuId: string) => Promise<void>;
}

export const AdminVariantsContext = createContext<AdminVariantsContextType | undefined>(undefined);

function apiToVariantGroup(api: ApiVariant): VariantGroup {
  return {
    id: api.id,
    productId: api.productId,
    name: api.name,
    values: Array.isArray(api.values) ? api.values : [],
    isActive: api.isActive,
  };
}

export const useAdminVariants = () => {
  const context = useContext(AdminVariantsContext);
  if (!context) {
    throw new Error('useAdminVariants debe usarse dentro de un AdminVariantsProvider');
  }
  return context;
};

// Re-export the helper function for use in the provider
export { apiToVariantGroup };