import { createContext, useContext } from 'react';
import type { Product } from '../../../types';

export type FavoriteProduct = Product & { stock?: number };

export const FAVORITES_STORAGE_KEY = 'allmart_favorites';

export interface FavoritesContextType {
  items: FavoriteProduct[];
  totalItems: number;
  isFavorite: (productId: string) => boolean;
  addFavorite: (product: FavoriteProduct) => void;
  removeFavorite: (productId: string) => void;
  toggleFavorite: (product: FavoriteProduct) => void;
  clearFavorites: () => void;
  syncFavorite: (product: FavoriteProduct) => void;
}

export const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites debe usarse dentro de un FavoritesProvider');
  }
  return context;
};