import { useState } from 'react';

export interface BulkEditData {
  name?: string;
  description?: string;
  image?: string;
}

/**
 * Hook para manejar el estado y lógica de la edición masiva de categorías.
 */
export function useCategoryBulkEdit() {
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const [bulkEditData, setBulkEditData] = useState<BulkEditData>({});

  const handleBulkEdit = (data: BulkEditData) => {
    // Filtrar solo los campos realmente editados
    const filteredData: BulkEditData = {};
    if (data.name) filteredData.name = data.name;
    if (data.description) filteredData.description = data.description;
    if (data.image) filteredData.image = data.image;
    setShowBulkEdit(true);
    setBulkEditData(filteredData);
  };

  return {
    showBulkEdit,
    setShowBulkEdit,
    bulkEditLoading,
    setBulkEditLoading,
    bulkEditData,
    setBulkEditData,
    handleBulkEdit
  };
}
