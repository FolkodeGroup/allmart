export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  slug: string;
  parentId?: string | null;
  itemCount?: number;
  isVisible: boolean;
}

export interface CategorySearchSuggestion {
  id: string;
  name: string;
  slug: string;
}
