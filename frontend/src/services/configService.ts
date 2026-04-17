/**
 * services/configService.ts
 * Servicio frontend para configuración dinámica del sitio.
 */

import { apiFetch } from '../utils/apiClient';

export interface NavigationItem {
  label: string;
  href: string;
}

export interface SortOption {
  label: string;
  value: string;
}

export interface FilterCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export interface FiltersData {
  categories: FilterCategory[];
}

export const configService = {
  /** Obtiene los items de navegación */
  async getNavigation(): Promise<NavigationItem[]> {
    const res = await apiFetch<{ data: NavigationItem[] }>('/api/config/navigation');
    return res.data;
  },

  /** Obtiene las opciones de ordenamiento */
  async getSortOptions(): Promise<SortOption[]> {
    const res = await apiFetch<{ data: SortOption[] }>('/api/config/sort-options');
    return res.data;
  },

  /** Obtiene los filtros disponibles */
  async getFilters(): Promise<FiltersData> {
    const res = await apiFetch<{ data: FiltersData }>('/api/config/filters');
    return res.data;
  },
};
