// types/bannerFilter.ts

export interface BannerFilterConfig {
    categorySlug?: string;        // "accesorios-bano"
    tags?: BannerTag[];           // ["oferta", "destacado", "nuevo"]
    // Escalable: agregar precio, marca, etc.
    // priceMax?: number;
    // brand?: string;
}

export type BannerTag = 'oferta' | 'destacado' | 'nuevo';

export const BANNER_TAGS: { value: BannerTag; label: string }[] = [
    { value: 'oferta', label: '🏷️ En oferta' },
    { value: 'destacado', label: '⭐ Destacados' },
    { value: 'nuevo', label: '🆕 Novedades' },
];