import type { Category, NavigationItem } from '../../../types';

export const baseNavigation: NavigationItem[] = [
  { label: 'Ofertas', href: '/productos?tag=oferta' },
  { label: 'Novedades', href: '/productos?tag=nuevo' },
];

export const fallbackNavigation: NavigationItem[] = [
  ...baseNavigation,
  { label: 'Ver todo el catalogo', href: '/productos' },
];

function toHumanLabel(slug: string): string {
  const decoded = decodeURIComponent(slug || '').trim();
  if (!decoded) return 'Categoria';

  const normalized = decoded.replace(/[-_]+/g, ' ').trim();
  if (!normalized) return 'Categoria';

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getCategoryLabel(category: Category): string {
  const trimmedName = category.name.trim();
  if (trimmedName) return trimmedName;
  return toHumanLabel(category.slug);
}

export function buildNavigationFromCategories(categories: Category[]): NavigationItem[] {
  const visible = categories.filter((category) => category.isVisible);
  const roots = visible.filter((category) => !category.parentId);
  const childrenByParent = new Map<string, Category[]>();

  for (const category of visible) {
    if (category.parentId) {
      const current = childrenByParent.get(category.parentId) ?? [];
      current.push(category);
      childrenByParent.set(category.parentId, current);
    }
  }

  // Limitar a máximo 6 categorías principales en el navbar (mantener limpio el header)
  const mainNavCategoryLimit = 6;
  const mainNavRoots = roots.slice(0, mainNavCategoryLimit);

  const rootItems: NavigationItem[] = mainNavRoots.map((category) => {
    const children = childrenByParent.get(category.id) ?? [];
    return {
      label: getCategoryLabel(category),
      href: `/productos?category=${encodeURIComponent(category.slug)}`,
      children: children.length
        ? children.map((child) => ({
            label: getCategoryLabel(child),
            href: `/productos?category=${encodeURIComponent(child.slug)}`,
          }))
        : undefined,
    };
  });

  return [
    ...baseNavigation,
    ...rootItems,
  ];
}
