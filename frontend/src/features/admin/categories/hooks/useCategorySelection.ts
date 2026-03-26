import { usePersistentSelection } from '../../../../hooks/usePersistentSelection';
import type { Category } from '../types/category';

/**
 * Hook para manejar la selección múltiple de categorías en la vista de admin.
 * Permite seleccionar/deseleccionar individualmente o en bloque.
 */
export function useCategorySelection(categories: Category[]) {
  const {
    selectedIds,
    add,
    remove,
    clear: clearSelection
  } = usePersistentSelection();

  // Determinar si todas las categorías visibles están seleccionadas
  const allVisibleSelected = categories.length > 0 && categories.every(cat => selectedIds.includes(cat.id));

  // Handler para checkbox general
  const handleSelectAllVisible = (checked: boolean) => {
    const visibleIds = categories.map(cat => cat.id);
    if (checked) {
      add(visibleIds);
    } else {
      remove(visibleIds);
    }
  };

  // Handler para checkbox individual
  const handleSelectCategory = (id: string, checked: boolean) => {
    if (checked) {
      add([id]);
    } else {
      remove([id]);
    }
  };

  return {
    selectedIds,
    allVisibleSelected,
    handleSelectAllVisible,
    handleSelectCategory,
    clearSelection
  };
}
