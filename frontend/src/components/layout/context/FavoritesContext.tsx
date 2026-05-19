import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  FAVORITES_STORAGE_KEY,
  FavoritesContext,
  type FavoriteProduct,
} from './FavoritesContextUtils';

const LEGACY_FAVORITE_KEY_PREFIX = 'wishlist-';

interface FavoritesStoragePayload {
  ids: string[];
  products: FavoriteProduct[];
}

function getLegacyFavoriteIds(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const ids: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !key.startsWith(LEGACY_FAVORITE_KEY_PREFIX)) {
      continue;
    }

    if (localStorage.getItem(key) === 'true') {
      ids.push(key.slice(LEGACY_FAVORITE_KEY_PREFIX.length));
    }
  }

  return ids;
}

function removeLegacyFavoriteKeys(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const keysToRemove: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(LEGACY_FAVORITE_KEY_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

function normalizePayload(value: unknown): FavoritesStoragePayload {
  const fallbackIds = getLegacyFavoriteIds();

  if (!value || typeof value !== 'object') {
    return { ids: fallbackIds, products: [] };
  }

  if (Array.isArray(value)) {
    const products = value as FavoriteProduct[];
    return {
      ids: products.map((product) => product.id),
      products,
    };
  }

  const candidate = value as Partial<FavoritesStoragePayload>;
  const ids = Array.isArray(candidate.ids) ? candidate.ids.filter(Boolean) : fallbackIds;
  const products = Array.isArray(candidate.products)
    ? (candidate.products as FavoriteProduct[])
    : [];

  return { ids, products };
}

function getOrderedProducts(payload: FavoritesStoragePayload): FavoriteProduct[] {
  const productMap = new Map(payload.products.map((product) => [product.id, product]));
  return payload.ids
    .map((id) => productMap.get(id))
    .filter((product): product is FavoriteProduct => Boolean(product));
}

function areProductsEqual(current: FavoriteProduct, next: FavoriteProduct): boolean {
  return JSON.stringify(current) === JSON.stringify(next);
}

function loadFavoritesFromStorage(): FavoritesStoragePayload {
  if (typeof window === 'undefined') {
    return { ids: [], products: [] };
  }

  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? normalizePayload(JSON.parse(raw)) : { ids: getLegacyFavoriteIds(), products: [] };
  } catch {
    return { ids: getLegacyFavoriteIds(), products: [] };
  }
}

function saveFavoritesToStorage(payload: FavoritesStoragePayload): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(payload));
    removeLegacyFavoriteKeys();
  } catch {
    // cuota excedida o almacenamiento no disponible
  }
}

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favoritesState, setFavoritesState] = useState<FavoritesStoragePayload>(loadFavoritesFromStorage);

  const items = getOrderedProducts(favoritesState);

  useEffect(() => {
    saveFavoritesToStorage(favoritesState);
  }, [favoritesState]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== FAVORITES_STORAGE_KEY) {
        return;
      }

      setFavoritesState(loadFavoritesFromStorage());
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isFavorite = (productId: string) => favoritesState.ids.includes(productId);

  const addFavorite = (product: FavoriteProduct) => {
    setFavoritesState((prev) => {
      const existingIndex = prev.products.findIndex((item) => item.id === product.id);
      const nextIds = prev.ids.includes(product.id) ? prev.ids : [product.id, ...prev.ids];

      if (existingIndex === -1) {
        return {
          ids: nextIds,
          products: [product, ...prev.products],
        };
      }

      if (areProductsEqual(prev.products[existingIndex], product) && nextIds === prev.ids) {
        return prev;
      }

      const nextProducts = [...prev.products];
      nextProducts[existingIndex] = product;

      return {
        ids: nextIds,
        products: nextProducts,
      };
    });
  };

  const removeFavorite = (productId: string) => {
    setFavoritesState((prev) => ({
      ids: prev.ids.filter((id) => id !== productId),
      products: prev.products.filter((item) => item.id !== productId),
    }));
  };

  const toggleFavorite = (product: FavoriteProduct) => {
    setFavoritesState((prev) => {
      if (prev.ids.includes(product.id)) {
        return {
          ids: prev.ids.filter((id) => id !== product.id),
          products: prev.products.filter((item) => item.id !== product.id),
        };
      }

      return {
        ids: [product.id, ...prev.ids],
        products: [product, ...prev.products.filter((item) => item.id !== product.id)],
      };
    });
  };

  const clearFavorites = () => {
    setFavoritesState({ ids: [], products: [] });
  };

  const syncFavorite = (product: FavoriteProduct) => {
    setFavoritesState((prev) => {
      if (!prev.ids.includes(product.id)) {
        return prev;
      }

      const index = prev.products.findIndex((item) => item.id === product.id);
      if (index === -1) {
        return {
          ids: prev.ids,
          products: [product, ...prev.products],
        };
      }

      if (areProductsEqual(prev.products[index], product)) {
        return prev;
      }

      const nextProducts = [...prev.products];
      nextProducts[index] = product;
      return {
        ids: prev.ids,
        products: nextProducts,
      };
    });
  };

  return (
    <FavoritesContext.Provider
      value={{
        items,
        totalItems: favoritesState.ids.length,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        clearFavorites,
        syncFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};