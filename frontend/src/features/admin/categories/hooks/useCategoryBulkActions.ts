import { useState } from 'react';

export interface BulkActionState {
  type: 'delete' | 'visibility' | null;
  visibilityValue?: boolean; // true = mostrar, false = ocultar
}

/**
 * Hook para manejar acciones masivas en categorías.
 * Solo maneja acciones que tienen sentido: eliminar y cambiar visibilidad.
 */
export function useCategoryBulkActions() {
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkActionState>({ type: null });

  const handleDeleteBulk = () => {
    setBulkAction({ type: 'delete' });
  };

  const handleToggleVisibilityBulk = (makeVisible: boolean) => {
    setBulkAction({ type: 'visibility', visibilityValue: makeVisible });
  };

  const closeBulkAction = () => {
    if (!bulkActionLoading) {
      setBulkAction({ type: null });
    }
  };

  return {
    bulkActionLoading,
    setBulkActionLoading,
    bulkAction,
    setBulkAction,
    handleDeleteBulk,
    handleToggleVisibilityBulk,
    closeBulkAction
  };
}
