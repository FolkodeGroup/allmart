/**
 * services/configService.ts
 * Servicio de configuración dinámica del sitio.
 */

import { prisma } from '../config/prisma';

/** Opciones de ordenamiento disponibles para el listado de productos */
const SORT_OPTIONS = [
  { label: 'Relevancia', value: 'relevance' },
  { label: 'Menor precio', value: 'price_asc' },
  { label: 'Mayor precio', value: 'price_desc' },
  { label: 'Mejor puntuación', value: 'rating' },
  { label: 'Más nuevos', value: 'newest' },
];

/**
 * Retorna los items de navegación a partir de las categorías activas.
 */
export async function getNavigation() {
  const categories = await prisma.category.findMany({
    where: { isVisible: true, parentId: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });

  return categories.map((cat) => ({
    label: cat.name,
    href: `/productos?category=${cat.slug}`,
  }));
}

/**
 * Retorna las opciones de orden disponibles.
 */
export function getSortOptions() {
  return SORT_OPTIONS;
}

/**
 * Retorna las opciones de filtro dinámicas (categorías activas).
 */
export async function getFilters() {
  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, parentId: true },
  });

  return {
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parentId,
    })),
  };
}
