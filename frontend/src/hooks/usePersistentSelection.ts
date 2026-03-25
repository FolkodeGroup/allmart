// Hook reutilizable para selección múltiple (adaptado de Productos)
import { useState } from 'react';

export function usePersistentSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const add = (ids: string[]) => setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
  const remove = (ids: string[]) => setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
  const toggle = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const clear = () => setSelectedIds([]);
  return { selectedIds, add, remove, toggle, clear, setSelectedIds };
}
