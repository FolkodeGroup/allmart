import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Category } from '../types';
import { categories as mockCategories } from '../data/mock';

const STORAGE_KEY = 'allmart_admin_categories';

function loadCategories(): Category[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return mockCategories;
}

function saveCategories(cats: Category[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
}

interface AdminCategoriesContextType {
  categories: Category[];
  addCategory: (c: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getCategory: (id: string) => Category | undefined;
}

const AdminCategoriesContext = createContext<AdminCategoriesContextType | undefined>(undefined);

export function AdminCategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(loadCategories);

  const addCategory = (c: Omit<Category, 'id'>): Category => {
    const newCat: Category = {
      ...c,
      id: `cat-${Date.now()}`,
      slug: c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    };
    setCategories(prev => {
      const next = [...prev, newCat];
      saveCategories(next);
      return next;
    });
    return newCat;
  };

  const updateCategory = (id: string, data: Partial<Category>) => {
    setCategories(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...data } : c);
      saveCategories(next);
      return next;
    });
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => {
      const next = prev.filter(c => c.id !== id);
      saveCategories(next);
      return next;
    });
  };

  const getCategory = (id: string) => categories.find(c => c.id === id);

  return (
    <AdminCategoriesContext.Provider value={{ categories, addCategory, updateCategory, deleteCategory, getCategory }}>
      {children}
    </AdminCategoriesContext.Provider>
  );
}

export function useAdminCategories() {
  const ctx = useContext(AdminCategoriesContext);
  if (!ctx) throw new Error('useAdminCategories debe usarse dentro de AdminCategoriesProvider');
  return ctx;
}
