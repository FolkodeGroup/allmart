// utils/bannerFilterToUrl.ts

import type { BannerFilterConfig } from '../types/bannerFilter';

export function bannerFilterToUrl(filter: BannerFilterConfig): string {
    if (!filter || Object.keys(filter).length === 0) {
        return '/productos';
    }

    const params = new URLSearchParams();

    if (filter.categorySlug) {
        params.set('category', filter.categorySlug);
    }

    // Cada tag usa su propio mecanismo (espejo de ProductListPage)
    const tags = filter.tags ?? [];
    if (tags.includes('destacado')) {
        params.set('tag', 'destacado');
    }
    // "oferta" y "nuevo" se manejan como flags internos en ProductListPage
    // Se pasan igual para que ProductListPage los active en el futuro
    if (tags.includes('oferta')) {
        params.set('tag', tags.includes('destacado') ? 'destacado,oferta' : 'oferta');
    }
    if (tags.includes('novedad')) {
        params.set('tag', 'novedad');
    }

    const qs = params.toString();
    return qs ? `/productos?${qs}` : '/productos';
}