import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Product, Category } from '../types';
import { products as mockProducts, categories as mockCategories } from '../data/mock';

export interface AdminProduct extends Omit<Product, 'category'> {
  category: Category;
  stock: number;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
}

const STORAGE_KEY = 'allmart_admin_products';

function loadProducts(): AdminProduct[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  // Cargar productos del mock como datos iniciales
  return mockProducts.map(p => ({ ...p, stock: 10, variants: [] }));
}

function saveProducts(products: AdminProduct[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

interface AdminProductsContextType {
  products: AdminProduct[];
  categories: Category[];
  addProduct: (p: Omit<AdminProduct, 'id'>) => void;
  updateProduct: (id: string, p: Partial<AdminProduct>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => AdminProduct | undefined;
}

const AdminProductsContext = createContext<AdminProductsContextType | undefined>(undefined);

export function AdminProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<AdminProduct[]>(loadProducts);

  const addProduct = (p: Omit<AdminProduct, 'id'>) => {
    const newProduct: AdminProduct = {
      ...p,
      id: `prod-${Date.now()}`,
      slug: p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    };
    setProducts(prev => {
      const next = [newProduct, ...prev];
      saveProducts(next);
      return next;
    });
  };

  const updateProduct = (id: string, data: Partial<AdminProduct>) => {
    setProducts(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...data } : p);
      saveProducts(next);
      return next;
    });
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id);
      saveProducts(next);
      return next;
    });
  };

  const getProduct = (id: string) => products.find(p => p.id === id);

  return (
    <AdminProductsContext.Provider value={{
      products,
      categories: mockCategories,
      addProduct,
      updateProduct,
      deleteProduct,
      getProduct,
    }}>
      {children}
    </AdminProductsContext.Provider>
  );
}

export function useAdminProducts() {
  const ctx = useContext(AdminProductsContext);
  if (!ctx) throw new Error('useAdminProducts debe usarse dentro de AdminProductsProvider');
  return ctx;
}
