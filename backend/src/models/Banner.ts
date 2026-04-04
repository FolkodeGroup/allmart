/**
 * models/Banner.ts
 * Banners con imágenes almacenadas en binario (WebP) en la base de datos.
 */

export interface Banner {
  id: string;
  title: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Banner con metadatos de imagen (para la administración) */
export interface BannerWithImageMeta extends Banner {
  width: number;
  height: number;
  thumbWidth?: number;
  thumbHeight?: number;
  sizeBytes: number;
  originalFilename?: string;
  altText?: string;
}

export type CreateBannerDTO = Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateBannerDTO = Partial<Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>> & { altText?: string };

