/**
 * context/AdminImagesContext.tsx
 * Contexto para gestión de imágenes de producto en el panel admin.
 * Consume la API REST del backend — sin mocks ni localStorage.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import * as imagesService from '../services/productImagesService';
import type { ApiProductImage, CreateImagePayload, UpdateImagePayload } from '../services/productImagesService';

// ─── Tipos exportados ─────────────────────────────────────────────────────────

/** Imagen de producto en el frontend */
export interface ProductImageItem {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  position: number;
}

interface AdminImagesContextType {
  /** Imágenes del producto actualmente seleccionado */
  images: ProductImageItem[];
  /** ID del producto cuyas imágenes están cargadas */
  selectedProductId: string | null;
  isLoading: boolean;
  error: string | null;

  /** Carga las imágenes de un producto desde la API */
  loadImages: (productId: string) => Promise<void>;
  /** Limpia las imágenes del estado */
  clearImages: () => void;

  /** Crea una imagen nueva */
  addImage: (productId: string, payload: CreateImagePayload) => Promise<ProductImageItem>;
  /** Actualiza url / altText / position de una imagen */
  updateImage: (productId: string, imageId: string, payload: UpdateImagePayload) => Promise<void>;
  /** Elimina una imagen */
  deleteImage: (productId: string, imageId: string) => Promise<void>;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const AdminImagesContext = createContext<AdminImagesContextType | undefined>(undefined);

// ─── Helper de mapeo ──────────────────────────────────────────────────────────

function apiToImageItem(api: ApiProductImage): ProductImageItem {
  return {
    id: api.id,
    productId: api.productId,
    url: api.url,
    altText: api.altText,
    position: api.position,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AdminImagesProvider({ children }: { children: ReactNode }) {
  const { token } = useAdminAuth();
  const [images, setImages] = useState<ProductImageItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function requireToken(): string {
    if (!token) throw new Error('No hay sesión activa');
    return token;
  }

  async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
    setIsLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Operaciones ────────────────────────────────────────────────────────────

  const loadImages = useCallback(async (productId: string) => {
    await withLoading(async () => {
      const t = requireToken();
      const data = await imagesService.fetchImagesByProduct(t, productId);
      setImages(data.map(apiToImageItem));
      setSelectedProductId(productId);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const clearImages = useCallback(() => {
    setImages([]);
    setSelectedProductId(null);
    setError(null);
  }, []);

  const addImage = async (productId: string, payload: CreateImagePayload): Promise<ProductImageItem> => {
    return withLoading(async () => {
      const t = requireToken();
      // Asignar posición automática si no se especifica
      const position = payload.position ?? images.length;
      const created = await imagesService.createProductImage(t, productId, { ...payload, position });
      const item = apiToImageItem(created);
      setImages(prev => [...prev, item].sort((a, b) => a.position - b.position));
      return item;
    });
  };

  const updateImage = async (
    productId: string,
    imageId: string,
    payload: UpdateImagePayload,
  ): Promise<void> => {
    await withLoading(async () => {
      const t = requireToken();
      const updated = await imagesService.updateProductImage(t, productId, imageId, payload);
      setImages(prev =>
        prev
          .map(img => (img.id === imageId ? apiToImageItem(updated) : img))
          .sort((a, b) => a.position - b.position),
      );
    });
  };

  const deleteImage = async (productId: string, imageId: string): Promise<void> => {
    await withLoading(async () => {
      const t = requireToken();
      await imagesService.deleteProductImage(t, productId, imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
    });
  };

  return (
    <AdminImagesContext.Provider
      value={{
        images,
        selectedProductId,
        isLoading,
        error,
        loadImages,
        clearImages,
        addImage,
        updateImage,
        deleteImage,
      }}
    >
      {children}
    </AdminImagesContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdminImages() {
  const ctx = useContext(AdminImagesContext);
  if (!ctx) throw new Error('useAdminImages debe usarse dentro de AdminImagesProvider');
  return ctx;
}
