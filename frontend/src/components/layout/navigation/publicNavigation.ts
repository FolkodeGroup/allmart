import type { Category, NavigationItem } from '../../../types';

export const baseNavigation: NavigationItem[] = [
  { label: 'Ofertas', href: '/productos?tag=oferta' },
  { label: 'Novedades', href: '/productos?tag=nuevo' },
];

export const fallbackNavigation: NavigationItem[] = [
  ...baseNavigation,
  { label: 'Ver todo el catalogo', href: '/productos' },
];

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

  const rootItems: NavigationItem[] = roots.map((category) => {
    const children = childrenByParent.get(category.id) ?? [];
    return {
      label: category.name,
      href: `/productos?category=${encodeURIComponent(category.slug)}`,
      children: children.length
        ? children.map((child) => ({
            label: child.name,
            href: `/productos?category=${encodeURIComponent(child.slug)}`,
          }))
        : undefined,
    };
  });

  return [
    ...baseNavigation,
    ...rootItems,
    { label: 'Ver todo el catalogo', href: '/productos' },
  ];
}
