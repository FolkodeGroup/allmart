/**
 * models/Banner.ts
 * Banners para mostrar dinámicamente en la homepage.
 */

export interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  link?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateBannerDTO = Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateBannerDTO = Partial<CreateBannerDTO>;
