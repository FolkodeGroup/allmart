import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Category } from '../types';
import * as categoriesService from '../services/categoriesService';
import { useAdminAuth } from './AdminAuthContext';
import { useNotification } from './NotificationContext';

interface AdminCategoriesContextType {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
  addCategory: (c: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  uploadCategoryImage: (id: string, file: File) => Promise<string>;
  getCategory: (id: string) => Category | undefined;
}

const AdminCategoriesContext = createContext<AdminCategoriesContextType | undefined>(undefined);

export function AdminCategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAdminAuth();
  const { showNotification } = useNotification();

  const refreshCategories = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await categoriesService.fetchAdminCategories(token);
      setCategories(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar categorías';
      setError(msg);
      showNotification('error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [token, showNotification]);

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  const addCategory = async (c: Omit<Category, 'id'>): Promise<Category> => {
    if (!token) throw new Error('No hay sesión activa');
    setIsLoading(true);
    try {
      const newCat = await categoriesService.createAdminCategory(token, c);
      setCategories(prev => [...prev, newCat]);
      showNotification('success', 'Categoría creada exitosamente');
      return newCat;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear categoría';
      showNotification('error', msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    if (!token) throw new Error('No hay sesión activa');
    setIsLoading(true);
    try {
      const updatedCat = await categoriesService.updateAdminCategory(token, id, data);
      setCategories(prev => prev.map(c => c.id === id ? updatedCat : c));
      showNotification('success', 'Categoría actualizada exitosamente');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar categoría';
      showNotification('error', msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!token) throw new Error('No hay sesión activa');
    setIsLoading(true);
    try {
      await categoriesService.deleteAdminCategory(token, id);
      setCategories(prev => prev.filter(c => c.id !== id));
      showNotification('success', 'Categoría eliminada exitosamente');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar categoría';
      showNotification('error', msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadCategoryImage = async (id: string, file: File): Promise<string> => {
    if (!token) throw new Error('No hay sesión activa');
    setIsLoading(true);
    try {
      const imageUrl = await categoriesService.uploadAdminCategoryImage(token, id, file);
      // Actualizamos localmente el estado de la categoría con la nueva imagen
      setCategories(prev => prev.map(c => 
        c.id === id ? { ...c, image: imageUrl } : c
      ));
      showNotification('success', 'Imagen de categoría actualizada');
      return imageUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir imagen';
      showNotification('error', msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  // ...existing code...

  const getCategory = (id: string) => categories.find(c => c.id === id);

  return (
    <AdminCategoriesContext.Provider value={{ 
      categories, 
      isLoading, 
      error, 
      refreshCategories,
      addCategory, 
      updateCategory, 
      deleteCategory, 
      uploadCategoryImage,
      getCategory 
    }}>
      {children}
    </AdminCategoriesContext.Provider>
  );
}

export function useAdminCategories() {
  const ctx = useContext(AdminCategoriesContext);
  if (!ctx) throw new Error('useAdminCategories debe usarse dentro de AdminCategoriesProvider');
  return ctx;
}
