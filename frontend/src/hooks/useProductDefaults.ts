/**
 * Hook para gestionar defaults persistentes por categoría
 * Almacena los valores utilizados recientemente en cada categoría
 */
import { useEffect, useState, useCallback } from 'react';

export interface ProductDefaults {
  categoryId: string;
  stock: number;
  visible: boolean;
  currency: string;
  lastUsed: number; // timestamp
}

const STORAGE_KEY = 'allmart_product_defaults';
const STORAGE_VERSION = 1;

export interface StoredDefaults {
  version: number;
  defaults: Record<string, ProductDefaults>;
}

/**
 * Custom hook para gestionar defaults persistentes
 */
export function useProductDefaults() {
  const [defaults, setDefaults] = useState<Record<string, ProductDefaults>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar defaults desde localStorage al montar el componente
  useEffect(() => {
    const loadDefaults = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: StoredDefaults = JSON.parse(stored);
          if (parsed.version === STORAGE_VERSION) {
            setDefaults(parsed.defaults);
          }
        }
      } catch (error) {
        console.warn('Error loading product defaults:', error);
      }
      setIsLoaded(true);
    };

    loadDefaults();
  }, []);

  // Guardar defaults en localStorage cuando cambian
  useEffect(() => {
    if (!isLoaded) return;

    try {
      if (Object.keys(defaults).length === 0) {
        // Si no hay defaults, remover la clave de localStorage
        localStorage.removeItem(STORAGE_KEY);
      } else {
        const dataToStore: StoredDefaults = {
          version: STORAGE_VERSION,
          defaults,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
      }
    } catch (error) {
      console.warn('Error saving product defaults:', error);
    }
  }, [defaults, isLoaded]);

  /**
   * Obtiene los defaults de una categoría específica
   */
  const getDefaults = useCallback(
    (categoryId: string): ProductDefaults | null => {
      return defaults[categoryId] || null;
    },
    [defaults]
  );

  /**
   * Obtiene los defaults más recientes (última categoría usada)
   */
  const getMostRecentDefaults = useCallback((): ProductDefaults | null => {
    const entries = Object.values(defaults);
    if (entries.length === 0) return null;

    // Ordena por lastUsed y retorna el más reciente
    return entries.sort((a, b) => b.lastUsed - a.lastUsed)[0];
  }, [defaults]);

  /**
   * Actualiza los defaults para una categoría
   */
  const setDefaults_ByCategory = useCallback(
    (categoryId: string, values: Partial<Omit<ProductDefaults, 'categoryId' | 'lastUsed'>>) => {
      setDefaults(prev => ({
        ...prev,
        [categoryId]: {
          categoryId,
          stock: values.stock ?? 0,
          visible: values.visible ?? true,
          currency: values.currency ?? 'ARS',
          lastUsed: Date.now(),
        },
      }));
    },
    []
  );

  /**
   * Limpia todos los defaults guardados
   */
  const clearAllDefaults = useCallback(() => {
    setDefaults({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * Limpia los defaults de una categoría específica
   */
  const clearDefaults_ByCategory = useCallback((categoryId: string) => {
    setDefaults(prev => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  }, []);

  return {
    defaults,
    isLoaded,
    getDefaults,
    getMostRecentDefaults,
    setDefaults: setDefaults_ByCategory,
    clearAllDefaults,
    clearDefaultsByCategory: clearDefaults_ByCategory,
  };
}
