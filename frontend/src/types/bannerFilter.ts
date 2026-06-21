// types/bannerFilter.ts
export type BannerDestinationType = 'category' | 'products';

export interface BannerFilterConfig {
    categorySlug?: string;        // "accesorios-bano"
    tags?: BannerTag[];           // ["oferta", "destacado", "nuevo"]
    destinationType?: BannerDestinationType;
    productSlugs?: string[];
    // Escalable: agregar precio, marca, etc.
    // priceMax?: number;
    // brand?: string;
}

export type BannerTag = 'oferta' | 'destacado' | 'novedad';

export const BANNER_TAGS: { value: BannerTag; label: string }[] = [
    { value: 'oferta', label: 'En oferta' },
    { value: 'destacado', label: 'Destacados' },
    { value: 'novedad', label: 'Novedades' },
];