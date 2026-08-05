/**
 * context/AdminProductsContext.tsx
 * Contexto de gestión de productos para el panel admin.
 * Usa llamadas HTTP al backend — sin mocks ni localStorage.
 */

import { createContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Product, Category } from '../types';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminCategories } from './AdminCategoriesContext';
import { useNotification } from './index';
import {
  fetchAdminProducts,
  fetchAdminLowStockCount,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  mapApiProductToProduct,
  mapAdminProductToPayload,
  type ApiProduct,
  type AdminProductsParams,
} from '../features/admin/products/productsService';
import {
  fetchVariantsByProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  createVariantChild,
} from '../features/admin/variants/variantsService';

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export interface AdminProduct extends Omit<Product, 'category' | 'skus'> {
  category: Category;
  stock: number;
  variants?: VariantGroup[];
  skus?: Array<{
    id?: string;
    sku?: string;
    attributes: Record<string, string>;
    stock?: number;
    price?: number;
    images?: string[];
  }>;
}

/** Grupo de variante: ej. { id, name: "Color", values: ["Rojo","Azul"] } */
export interface VariantGroup {
  id: string;
  name: string;
  values: string[];
}

// ─── Mapeador: ApiProduct → AdminProduct ──────────────────────────────────────

function apiToAdminProduct(api: ApiProduct, categories: Category[]): AdminProduct {
  const base = mapApiProductToProduct(api, categories);
  return {
    ...base,
    stock: api.stock,
    variants: [],
    primarySupplierId: api.primarySupplierId ?? null,
  };
}

// ─── Tipos del contexto ───────────────────────────────────────────────────────

export interface AdminProductsContextType {
  products: AdminProduct[];
  categories: Category[];
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  error: string | null;
  refreshProducts: (params?: AdminProductsParams) => Promise<void>;
  refreshCurrentPage: () => Promise<void>;
  addProduct: (p: Omit<AdminProduct, 'id'>) => Promise<AdminProduct>;
  updateProduct: (id: string, p: Partial<AdminProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => AdminProduct | undefined;
  loadProductVariants: (productId: string) => Promise<VariantGroup[]>;
  getLowStockCount: () => number;
  lowStockTotal: number;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const AdminProductsContext = createContext<AdminProductsContextType | undefined>(undefined);
export default AdminProductsContext;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AdminProductsProvider({ children }: { children: ReactNode }) {
  const { token } = useAdminAuth();
  const { categories } = useAdminCategories();
  const { showNotification } = useNotification();

  const lastParamsRef = useRef<AdminProductsParams | undefined>(undefined);

  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const showNotificationRef = useRef(showNotification);
  showNotificationRef.current = showNotification;

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [lowStockTotal, setLowStockTotal] = useState(0);

  /** Carga (o recarga) los productos desde el backend con paginación y búsqueda */
  const refreshProducts = useCallback(async (params?: AdminProductsParams) => {
    if (!tokenRef.current) return;
    if (params !== undefined) lastParamsRef.current = params;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAdminProducts(tokenRef.current, params ?? lastParamsRef.current);
      setProducts(response.data.map((p) => apiToAdminProduct(p, categoriesRef.current)));
      setPagination({
        total: response.total,
        page: response.page,
        totalPages: response.totalPages,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar productos';
      setError(msg);
      showNotificationRef.current('error', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Recarga usando los últimos parámetros */
  const refreshCurrentPage = useCallback(async () => {
    await refreshProducts(lastParamsRef.current);
  }, [refreshProducts]);

  /** Obtiene el conteo total de productos con stock < 5 desde el backend */
  const refreshLowStockCount = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      const count = await fetchAdminLowStockCount(tokenRef.current);
      setLowStockTotal(count);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    if (token) {
      refreshProducts({ page: 1, limit: 500 });
      refreshLowStockCount();
    }
  }, [token, refreshProducts, refreshLowStockCount]);

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  const addProduct = async (p: Omit<AdminProduct, 'id'>) => {
    if (!token) throw new Error('No autenticado');
    try {
      const { variants, skus, ...productBase } = p;
      const payload = mapAdminProductToPayload(productBase);
      const created = await createAdminProduct(payload, token);

      // 1. Crear grupos de variantes si existen
      if (variants && variants.length > 0) {
        for (const v of variants) {
          await createVariant(token, created.id, { name: v.name, values: v.values });
        }
      }

      // 2. Crear combinaciones/SKUs de variantes si fueron generadas durante el alta inicial
      if (skus && skus.length > 0) {
        for (const s of skus) {
          await createVariantChild(token, created.id, {
            sku: s.sku,
            attributes: s.attributes || {},
            stock: typeof s.stock === 'number' ? s.stock : Number(s.stock ?? 0),
            price: typeof s.price === 'number' ? s.price : s.price ? Number(s.price) : undefined,
            images: s.images,
          });
        }
      }

      const newProduct = apiToAdminProduct(created, categoriesRef.current);
      showNotificationRef.current('success', 'Producto creado exitosamente con sus variantes');
      await Promise.all([refreshCurrentPage(), refreshLowStockCount()]);
      return newProduct;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear producto';
      showNotificationRef.current('error', msg);
      throw err;
    }
  };

  const updateProduct = async (id: string, data: Partial<AdminProduct>) => {
    if (!token) throw new Error('No autenticado');

    try {
      const current = products.find((p) => p.id === id);
      if (!current) return;

      const { variants, ...updateData } = data;
      const merged = { ...current, ...updateData };
      const payload = mapAdminProductToPayload(merged);
      await updateAdminProduct(id, payload, token);

      if (variants) {
        const existingVariants = await fetchVariantsByProduct(token, id);

        for (const ev of existingVariants) {
          const stillExists = variants.find(v => v.id === ev.id);
          if (!stillExists) {
            await deleteVariant(token, id, ev.id);
          }
        }

        for (const v of variants) {
          if (v.id.startsWith('g-')) {
            await createVariant(token, id, { name: v.name, values: v.values });
          } else {
            await updateVariant(token, id, v.id, { name: v.name, values: v.values });
          }
        }
      }

      showNotificationRef.current('success', 'Producto actualizado exitosamente');
      await Promise.all([refreshCurrentPage(), refreshLowStockCount()]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar producto';
      showNotificationRef.current('error', msg);
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    if (!token) throw new Error('No autenticado');
    try {
      await deleteAdminProduct(id, tokenRef.current!);
      showNotificationRef.current('success', 'Producto eliminado exitosamente');
      await Promise.all([refreshCurrentPage(), refreshLowStockCount()]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar producto';
      showNotificationRef.current('error', msg);
      throw err;
    }
  };

  const loadProductVariants = async (productId: string): Promise<VariantGroup[]> => {
    if (!token) return [];
    try {
      const apiVariants = await fetchVariantsByProduct(token, productId);
      const variants: VariantGroup[] = apiVariants.map(v => ({
        id: v.id,
        name: v.name,
        values: v.values,
      }));

      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, variants } : p
      ));

      return variants;
    } catch {
      return [];
    }
  };

  const getProduct = (id: string) => products.find((p) => p.id === id);

  const getLowStockCount = () => lowStockTotal;

  return (
    <AdminProductsContext.Provider
      value={{
        products,
        categories,
        loading,
        total: pagination.total,
        page: pagination.page,
        totalPages: pagination.totalPages,
        error,
        refreshProducts,
        refreshCurrentPage,
        addProduct,
        updateProduct,
        deleteProduct,
        getProduct,
        getLowStockCount,
        loadProductVariants,
        lowStockTotal,
      }}
    >
      {children}
    </AdminProductsContext.Provider>
  );
}