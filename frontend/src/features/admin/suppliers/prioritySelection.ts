const STORAGE_PREFIX = 'allmart.supplier-priority-selection';

export function buildSupplierPriorityKey(supplierId: string) {
  return `${STORAGE_PREFIX}:${supplierId}`;
}

export function readSelectedProductIds(supplierId: string): string[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(buildSupplierPriorityKey(supplierId));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function writeSelectedProductIds(supplierId: string, selectedIds: string[]) {
  if (typeof window === 'undefined') return;
  const value = JSON.stringify(selectedIds);
  window.localStorage.setItem(buildSupplierPriorityKey(supplierId), value);
}

export function toggleSelectedProductId(currentIds: string[], productId: string) {
  const next = new Set(currentIds);
  if (next.has(productId)) {
    next.delete(productId);
  } else {
    next.add(productId);
  }

  return Array.from(next);
}
