/**
 * hooks/useFavorites.ts
 * Hook para gestionar favoritos del usuario autenticado.
 */

import { useState, useCallback, useEffect } from 'react';
import { favoritesService, type FavoriteItem } from '../services/favoritesService';

export function useFavorites(isAuthenticated: boolean) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await favoritesService.getFavorites();
      setFavorites(data);
    } catch {
      // silently fail – user might not have favorites
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = useCallback(
    (productId: string) => favorites.some((f) => f.productId === productId),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!isAuthenticated) return false;
      try {
        const result = await favoritesService.toggleFavorite(productId);
        // Refrescar la lista completa para mantener sincronizado
        await fetchFavorites();
        return result.isFavorite;
      } catch {
        return false;
      }
    },
    [isAuthenticated, fetchFavorites],
  );

  return {
    favorites,
    loading,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites,
  };
}
