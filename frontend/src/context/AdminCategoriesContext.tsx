import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Category } from '../types';
import * as categoriesService from '../features/admin/categories/categoriesService';
import { useAdminAuth } from './AdminAuthContext';
import { useNotification } from './NotificationContext';

interface AdminCategoriesContextType {
  categories: Category[];
  isLoading: boolean;
  total: number;
  page: number;
  totalPages: number;
  error: string | null;
  refreshCategories: (params?: categoriesService.AdminCategoriesParams) => Promise<void>;
  refreshCategory: (id: string) => Promise<void>;
  addCategory: (c: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  uploadCategoryImage: (id: string, file: File) => Promise<string>;
  deleteCategoryImage: (id: string) => Promise<void>;
  getCategory: (id: string) => Category | undefined;
}

const AdminCategoriesContext = createContext<AdminCategoriesContextType | undefined>(undefined);

export function AdminCategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const { token } = useAdminAuth();
  const { showNotification } = useNotification();

  /** Carga (o recarga) las categorías desde el backend con paginación, búsqueda y filtros avanzados */
  const refreshCategories = useCallback(async (params?: categoriesService.AdminCategoriesParams) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await categoriesService.fetchAdminCategories(token, params);
      setCategories(response.data.map(categoriesService.mapApiCategoryToCategory));
      setPagination({
        total: response.total,
        page: response.page,
        totalPages: response.totalPages,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar categorías';
      setError(message);
      showNotification('error', message);
    } finally {
      setIsLoading(false);
    }
  }, [token, showNotification]);

  /** Recarga una categoría específica desde el backend y actualiza el estado */
  const refreshCategory = useCallback(async (id: string) => {
    if (!token) return;
    try {
      const category = await categoriesService.fetchAdminCategory(token, id);
      setCategories(prev =>
        prev.map(cat =>
          cat.id === id ? category : cat
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al recargar categoría';
      setError(message);
      showNotification('error', message);
    }
  }, [token, showNotification]);

  /** Inicialmente carga el listado completo */
  useEffect(() => {
    if (token) refreshCategories();
  }, [token, refreshCategories]);

  const addCategory = async (category: Omit<Category, 'id'>) => {
    if (!token) throw new Error('No autenticado');
    try {
      const newCategory = await categoriesService.createAdminCategory(token, category);
      // Actualización optimista: agregar la nueva categoría al inicio del array
      setCategories(prev => [newCategory, ...prev]);
      // Incrementar el total
      setPagination(prev => ({ ...prev, total: prev.total + 1 }));
      showNotification('success', 'Categoría creada exitosamente');
      return newCategory;
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Error al crear categoría');
      throw err;
    }
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    if (!token) throw new Error('No autenticado');
    try {
      await categoriesService.updateAdminCategory(token, id, data);
      // Actualización optimista: actualizar la categoría en el array
      setCategories(prev =>
        prev.map(cat =>
          cat.id === id ? { ...cat, ...data } : cat
        )
      );
      showNotification('success', 'Categoría actualizada exitosamente');
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Error al actualizar categoría');
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!token) throw new Error('No autenticado');
    try {
      await categoriesService.deleteAdminCategory(token, id);
      // Actualización optimista: remover la categoría del array
      setCategories(prev => prev.filter(cat => cat.id !== id));
      // Decrementar el total
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      showNotification('success', 'Categoría eliminada exitosamente');
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Error al eliminar categoría');
      throw err;
    }
  };

  const uploadCategoryImage = async (id: string, file: File) => {
    if (!token) throw new Error('No autenticado');
    try {
      const url = await categoriesService.uploadAdminCategoryImage(token, id, file);
      // Actualización optimista: actualizar la imagen en el array
      setCategories(prev =>
        prev.map(cat =>
          cat.id === id ? { ...cat, image: url } : cat
        )
      );
      showNotification('success', 'Imagen de categoría subida');
      return url;
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Error al subir imagen');
      throw err;
    }
  };

  const deleteCategoryImage = async (id: string) => {
    if (!token) throw new Error('No autenticado');
    try {
      await categoriesService.deleteAdminCategoryImage(token, id);
      // Actualización optimista: remover la imagen del array
      setCategories(prev =>
        prev.map(cat =>
          cat.id === id ? { ...cat, image: '' } : cat
        )
      );
      showNotification('success', 'Imagen de categoría eliminada');
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Error al eliminar imagen');
      throw err;
    }
  };

  const getCategory = (id: string) => categories.find(c => c.id === id);

  return (
    <AdminCategoriesContext.Provider
      value={{
        categories,
        isLoading,
        total: pagination.total,
        page: pagination.page,
        totalPages: pagination.totalPages,
        error,
        refreshCategories,
        refreshCategory,
        addCategory,
        updateCategory,
        deleteCategory,
        uploadCategoryImage,
        deleteCategoryImage,
        getCategory
      }}
    >
      {children}
    </AdminCategoriesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminCategories() {
  const context = useContext(AdminCategoriesContext);
  if (context === undefined) {
    throw new Error('useAdminCategories debe usarse dentro de un AdminCategoriesProvider');
  }
  return context;
}
