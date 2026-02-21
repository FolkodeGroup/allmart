import type { Product } from '../types';
import { products as mockProducts } from './mock';

const STORAGE_KEY = 'allmart_admin_products';

export function getProducts(): Product[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return mockProducts;
}
