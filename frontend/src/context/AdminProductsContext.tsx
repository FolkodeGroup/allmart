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
import {
  fetchVariantsByProduct,
  createVariant,
  updateVariant,
  deleteVariant,
} from '../features/admin/variants/variantsService';

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
  addProduct: (p: Omit<AdminProduct, 'id'>) => Promise<AdminProduct>;
  updateProduct: (id: string, p: Partial<AdminProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => AdminProduct | undefined;
  loadProductVariants: (productId: string) => Promise<VariantGroup[]>;
  getLowStockCount: () => number;
  duplicateProduct: (product: AdminProduct) => Promise<void>;
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

  /* Carga inicial cuando el token o las categorías están disponibles/ comentado porque genera un re-render */
  //useEffect(() => {
  //  if (token && categories.length > 0) {
  //    refreshProducts();
  //  }
  //}, [token, categories.length, refreshProducts]);

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  const addProduct = async (p: Omit<AdminProduct, 'id'>) => {
    if (!token) throw new Error('No autenticado');
    try {
      const { variants, ...productBase } = p;
      const payload = mapAdminProductToPayload(productBase);
      const created = await createAdminProduct(payload, token);

      // Si tiene variantes, las creamos una por una (el backend actual parece crearlas por producto)
      if (variants && variants.length > 0) {
        for (const v of variants) {
          await createVariant(token, created.id, { name: v.name, values: v.values });
        }
      }

      const newProduct = apiToAdminProduct(created, categories);
      setProducts((prev) => [newProduct, ...prev]);
      showNotification('success', 'Producto creado exitosamente');
      await refreshProducts();
      return newProduct;
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

      const { variants, ...updateData } = data;
      const merged = { ...current, ...updateData };
      const payload = mapAdminProductToPayload(merged);
      const updated = await updateAdminProduct(id, payload, token);

      // Gestión de variantes si se proporcionan
      if (variants) {
        // En un enfoque simple, borramos las anteriores y creamos las nuevas
        // O si el backend soporta update, lo usamos.
        // fetch actual para saber qué borrar
        const existingVariants = await fetchVariantsByProduct(token, id);

        // 1. Identificar variantes a eliminar (las que están en DB pero no en el nuevo set)
        // Nota: El form actual genera IDs temporales 'g-...' para nuevas,
        // y mantiene las existentes si vinieran de la DB.
        for (const ev of existingVariants) {
          const stillExists = variants.find(v => v.id === ev.id);
          if (!stillExists) {
            await deleteVariant(token, id, ev.id);
          }
        }

        // 2. Crear o Actualizar
        for (const v of variants) {
          if (v.id.startsWith('g-')) {
            // Es nueva
            await createVariant(token, id, { name: v.name, values: v.values });
          } else {
            // Ya existe, actualizar
            await updateVariant(token, id, v.id, { name: v.name, values: v.values });
          }
        }
      }

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

  const loadProductVariants = async (productId: string): Promise<VariantGroup[]> => {
    if (!token) return [];
    try {
      const apiVariants = await fetchVariantsByProduct(token, productId);
      const variants: VariantGroup[] = apiVariants.map(v => ({
        id: v.id,
        name: v.name,
        values: v.values,
      }));

      // Actualizamos el producto en el estado local con sus variantes
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, variants } : p
      ));

      return variants;
    } catch (err) {
      console.error('Error al cargar variantes:', err);
      return [];
    }
  };

  const getProduct = (id: string) => products.find((p) => p.id === id);


  const duplicateProduct = async (product: AdminProduct) => {
    if (!token) throw new Error('No autenticado');
    try {
      // Construir payload base
      const { getDuplicateProductPayload } = await import('../features/admin/products/productsService');
      const payload = getDuplicateProductPayload(product);
      // Crear producto duplicado
      const created = await createAdminProduct(payload, token);
      // Duplicar variantes si existen
      if (product.variants && product.variants.length > 0) {
        for (const v of product.variants) {
          await createVariant(token, created.id, { name: v.name, values: v.values });
        }
      }
      showNotification('success', 'Producto duplicado exitosamente');
      await refreshProducts();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al duplicar producto';
      showNotification('error', msg);
      throw err;
    }
  };

  const getLowStockCount = () => products.filter((p) => p.stock < 5).length;

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
        getLowStockCount,
        loadProductVariants,
        duplicateProduct,
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
