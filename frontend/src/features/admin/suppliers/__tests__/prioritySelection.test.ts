import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildSupplierPriorityKey,
  readSelectedProductIds,
  writeSelectedProductIds,
  toggleSelectedProductId,
} from '../prioritySelection';

describe('prioritySelection helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists and reads selected product ids for a supplier', () => {
    const supplierId = 'supplier-1';
    const ids = ['prod-1', 'prod-2'];

    writeSelectedProductIds(supplierId, ids);

    expect(readSelectedProductIds(supplierId)).toEqual(ids);
    expect(window.localStorage.getItem(buildSupplierPriorityKey(supplierId))).toContain('prod-1');
  });

  it('toggles ids in and out of the selection set', () => {
    expect(toggleSelectedProductId([], 'prod-1')).toEqual(['prod-1']);
    expect(toggleSelectedProductId(['prod-1'], 'prod-1')).toEqual([]);
    expect(toggleSelectedProductId(['prod-1', 'prod-2'], 'prod-3')).toEqual(['prod-1', 'prod-2', 'prod-3']);
  });
});
