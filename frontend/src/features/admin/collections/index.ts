/**
 * features/admin/collections/index.ts
 * Exports para el módulo de collections
 */

export { default as AdminCollections } from './AdminCollections';
export { default as AdminCollectionForm } from './AdminCollectionForm';
export { collectionsService } from './collectionsService';
export type { Collection, PaginatedCollections } from './collectionsService';
