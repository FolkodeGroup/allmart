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
import {
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  mapApiProductToProduct,
  mapAdminProductToPayload,
  type ApiProduct,
} from '../services/productsService';

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
  error: string | null;
  refreshProducts: () => Promise<void>;
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

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Carga (o recarga) los productos desde el backend */
  const refreshProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const apiProducts = await fetchAdminProducts(token);
      setProducts(apiProducts.map((p) => apiToAdminProduct(p, categories)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [token, categories]);

  /* Carga inicial cuando el token o las categorías están disponibles */
  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  const addProduct = async (p: Omit<AdminProduct, 'id'>) => {
    if (!token) throw new Error('No autenticado');
    const payload = mapAdminProductToPayload(p);
    const created = await createAdminProduct(payload, token);
    const newProduct = apiToAdminProduct(created, categories);
    
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProduct = async (id: string, data: Partial<AdminProduct>) => {
    if (!token) throw new Error('No autenticado');

    const current = products.find((p) => p.id === id);
    if (!current) return;
    
    const merged = { ...current, ...data };
    const payload = mapAdminProductToPayload(merged);
    
    // Si hay datos que pertenecen a la API, actualizamos
    const updated = await updateAdminProduct(id, payload, token);
    
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? apiToAdminProduct(updated, categories) : p
      )
    );
  };

  const deleteProduct = async (id: string) => {
    if (!token) throw new Error('No autenticado');
    await deleteAdminProduct(id, token);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const getProduct = (id: string) => products.find((p) => p.id === id);

  return (
    <AdminProductsContext.Provider
      value={{
        products,
        categories,
        loading,
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdminProducts() {
  const ctx = useContext(AdminProductsContext);
  if (!ctx) throw new Error('useAdminProducts debe usarse dentro de AdminProductsProvider');
  return ctx;
}
