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
  images: string[];
  category: Category;
  categoryId?: string; // Helper property for convenience
  categoryIds?: string[];
  categories?: Category[];
  tags: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  sku: string;
  features?: string[];
  isFeatured?: boolean;
  primarySupplierId?: string | null;
  skus?: Array<{ id: string; sku: string; attributes: Record<string, string>; stock: number; price?: number; images?: string[] }>
  selectedAttributes?: Record<string, string>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  itemCount?: number;
  isVisible: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
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
