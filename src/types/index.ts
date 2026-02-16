/* ============================================
   ALLMART TYPE DEFINITIONS
   ============================================ */

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  category: Category;
  tags: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  sku: string;
  features?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  itemCount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface NavigationItem {
  label: string;
  href: string;
  children?: NavigationItem[];
}

export interface Benefit {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  type: 'checkbox' | 'range' | 'radio';
}

export type SortOption = {
  label: string;
  value: string;
};
