/**
 * context/AdminProductsContext.tsx
 * Contexto de gestión de productos para el panel admin.
 * Usa llamadas HTTP al backend — sin mocks ni localStorage.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Product, Category } from '../types';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminCategories } from './AdminCategoriesContext';
import { useNotification } from './NotificationContext';
import {
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  mapApiProductToProduct,
  mapAdminProductToPayload,
  type ApiProduct,
  type AdminProductsParams,
} from '../features/admin/products/productsService';

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export interface AdminProduct extends Omit<Product, 'category'> {
  category: Category;
  stock: number;
  variants?: VariantGroup[];
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
  };
}

// ─── Tipos del contexto ───────────────────────────────────────────────────────

interface AdminProductsContextType {
  products: AdminProduct[];
  categories: Category[];
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  error: string | null;
  refreshProducts: (params?: AdminProductsParams) => Promise<void>;
  addProduct: (p: Omit<AdminProduct, 'id'>) => Promise<void>;
  updateProduct: (id: string, p: Partial<AdminProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => AdminProduct | undefined;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const AdminProductsContext = createContext<AdminProductsContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AdminProductsProvider({ children }: { children: ReactNode }) {
  const { token } = useAdminAuth();
  const { categories } = useAdminCategories();
  const { showNotification } = useNotification();

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });

  /** Carga (o recarga) los productos desde el backend con paginación y búsqueda */
  const refreshProducts = useCallback(async (params?: AdminProductsParams) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAdminProducts(token, params);
      setProducts(response.data.map((p) => apiToAdminProduct(p, categories)));
      setPagination({
        total: response.total,
        page: response.page,
        totalPages: response.totalPages,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar productos';
      setError(msg);
      showNotification('error', msg);
    } finally {
      setLoading(false);
    }
  }, [token, categories, showNotification]);

  /* Carga inicial cuando el token o las categorías están disponibles */
  useEffect(() => {
    if (token && categories.length > 0) {
      refreshProducts();
    }
  }, [token, categories.length, refreshProducts]);

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  const addProduct = async (p: Omit<AdminProduct, 'id'>) => {
    if (!token) throw new Error('No autenticado');
    try {
      const payload = mapAdminProductToPayload(p);
      const created = await createAdminProduct(payload, token);
      const newProduct = apiToAdminProduct(created, categories);
      setProducts((prev) => [newProduct, ...prev]);
      showNotification('success', 'Producto creado exitosamente');
      await refreshProducts();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear producto';
      showNotification('error', msg);
      throw err;
    }
  };

  const updateProduct = async (id: string, data: Partial<AdminProduct>) => {
    if (!token) throw new Error('No autenticado');

    try {
      const current = products.find((p) => p.id === id);
      if (!current) return;
      const merged = { ...current, ...data };
      const payload = mapAdminProductToPayload(merged);
      const updated = await updateAdminProduct(id, payload, token);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? apiToAdminProduct(updated, categories) : p
        )
      );
      showNotification('success', 'Producto actualizado exitosamente');
      await refreshProducts();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar producto';
      showNotification('error', msg);
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    if (!token) throw new Error('No autenticado');
    try {
      await deleteAdminProduct(id, token);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showNotification('success', 'Producto eliminado exitosamente');
      await refreshProducts();
    } catch (err) {
       const msg = err instanceof Error ? err.message : 'Error al eliminar producto';
       showNotification('error', msg);
       throw err;
    }
  };

  const getProduct = (id: string) => products.find((p) => p.id === id);

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
        addProduct,
        updateProduct,
        deleteProduct,
        getProduct,
      }}
    >
      {children}
    </AdminProductsContext.Provider>
  );
}

export function useAdminProducts() {
  const context = useContext(AdminProductsContext);
  if (context === undefined) {
    throw new Error('useAdminProducts debe usarse dentro de un AdminProductsProvider');
  }
  return context;
}
