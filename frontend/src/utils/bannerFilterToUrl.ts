// utils/bannerFilterToUrl.ts

import type { BannerFilterConfig } from '../types/bannerFilter';

export function bannerFilterToUrl(filter: BannerFilterConfig): string {
    if (!filter || Object.keys(filter).length === 0) {
        return '/productos';
    }

    const params = new URLSearchParams();

    // Destino: categoría o productos específicos (excluyentes)
    if (filter.destinationType === 'products' && filter.productSlugs?.length) {
        // Lleva al listado filtrando por slugs específicos
        // ProductListPage deberá leer este param (ver paso 4)
        params.set('slugs', filter.productSlugs.join(','));
    } else if (filter.categorySlug) {
        params.set('category', filter.categorySlug);
    }

    // Tags se combinan con cualquier destino
    const tags = filter.tags ?? [];
    if (tags.includes('destacado')) params.set('tag', 'destacado');
    if (tags.includes('oferta')) params.set('tag', 'oferta');
    if (tags.includes('novedad')) params.set('tag', 'novedad');

    const qs = params.toString();
    return qs ? `/productos?${qs}` : '/productos';
}