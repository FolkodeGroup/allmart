import React from 'react';

export interface ProductImage {
  id: string;
  url: string;
  isThumbnail: boolean;
  variantIds: string[];
}

export interface ProductVariant {
  id: string;
  name: string;
}

export interface ProductDetailImagesContext {
  images: ProductImage[];
  setImages: React.Dispatch<React.SetStateAction<ProductImage[]>>;
  variants: ProductVariant[];
  setVariants: React.Dispatch<React.SetStateAction<ProductVariant[]>>;
}
