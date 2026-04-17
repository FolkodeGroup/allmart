import { useEffect, useState } from 'react';
import styles from './ProductDetailVariants.module.css';
import { useAdminVariants } from '../../../../context/AdminVariantsContext';
import { useAdminProducts } from '../../../../context/useAdminProductsContext';
import { VariantGroupsGrid } from '../../variants/components/VariantGroupsGrid';
import { VariantForm } from '../../variants/components/VariantForm';
import { VariantHeader } from '../../variants/components/VariantHeader';
import { VariantEditModal } from '../../variants/components/VariantEditModal';

interface ProductDetailVariantsProps {
  productId: string;
}

export function ProductDetailVariants({ productId }: ProductDetailVariantsProps) {
  const {
    variants,
    loadVariants,
    addVariant,
    updateVariant,
    deleteVariant,
    toggleVariantStatus,
    addValueToVariant,
    removeValueFromVariant,
  } = useAdminVariants();
  const { getProduct } = useAdminProducts();
  const [newGroupName, setNewGroupName] = useState('');
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modal avanzado
  const [editModal, setEditModal] = useState<{ open: boolean; groupId: string | null }>({ open: false, groupId: null });
  const [editModalData, setEditModalData] = useState<{ name: string; values: string[] }>({ name: '', values: [] });

  const product = getProduct(productId);

  useEffect(() => {
    if (productId) {
      loadVariants(productId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Handlers para acciones inline
  type VariantGroup = { name: string; values: string[] };
  const handleDuplicate = async (group: VariantGroup) => {
    const baseName = group.name + ' (Copia)';
    let name = baseName;
    let i = 2;
    while (variants.some((v: VariantGroup) => v.name === name)) {
      name = `${baseName} ${i++}`;
    }
    await addVariant(productId, name, group.values);
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      setErrors(e => ({ ...e, group: 'El nombre es requerido' }));
      return;
    }
    try {
      await addVariant(productId, newGroupName.trim());
      setNewGroupName('');
      setErrors(e => ({ ...e, group: '' }));
    } catch (err) {
      setErrors(e => ({ ...e, group: 'Error al crear grupo' }));
    }
  };

  const handleEditName = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    await updateVariant(productId, id, { name: newName.trim() });
  };

  const handleDelete = async (id: string) => {
    await deleteVariant(productId, id);
  };

  const handleToggleStatus = async (id: string, newStatus: boolean) => {
    await toggleVariantStatus(productId, id, newStatus);
  };

  const handleAddValue = async (groupId: string, value: string) => {
    if (!value.trim()) return;
    await addValueToVariant(productId, groupId, value.trim());
    setNewValues(v => ({ ...v, [groupId]: '' }));
  };

  const handleRemoveValue = async (groupId: string, value: string) => {
    await removeValueFromVariant(productId, groupId, value);
  };

  const handleEditValue = async (groupId: string, oldValue: string, newValue: string) => {
    if (!newValue.trim()) return;
    const group = variants.find((v: any) => v.id === groupId);
    if (!group) return;
    const values = group.values.map((val: string) => (val === oldValue ? newValue.trim() : val));
    await updateVariant(productId, groupId, { values });
  };

  const handleOpenEditModal = (groupId: string) => {
    const group = variants.find((v: any) => v.id === groupId);
    if (!group) return;
    setEditModalData({ name: group.name, values: group.values });
    setEditModal({ open: true, groupId });
  };

  const handleSaveEditModal = async (name: string, values: string[]) => {
    if (!editModal.groupId) return;
    await updateVariant(productId, editModal.groupId, { name, values });
    setEditModal({ open: false, groupId: null });
  };

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        {product && (
          <VariantHeader selectedProduct={product} groupCount={variants.length} />
        )}
        <VariantForm
          newGroupName={newGroupName}
          setNewGroupName={setNewGroupName}
          onAddGroup={handleAddGroup}
          error={errors.group || ''}
          canCreate={true}
        />
        <VariantGroupsGrid
          groups={variants}
          onEditName={handleEditName}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onEditValue={handleEditValue}
          onToggleStatus={handleToggleStatus}
          onAddValue={handleAddValue}
          onRemoveValue={handleRemoveValue}
          canEdit={true}
          canDelete={true}
          newValues={newValues}
          setNewValue={(groupId, value) => setNewValues(v => ({ ...v, [groupId]: value }))}
          errors={{}}
          isPendingNavigation={false}
          onOpenEditModal={handleOpenEditModal}
        />

        <VariantEditModal
          open={editModal.open}
          initialName={editModalData.name}
          initialValues={editModalData.values}
          onClose={() => setEditModal({ open: false, groupId: null })}
          onSave={handleSaveEditModal}
        />
      </section>
    </div>
  );
}
