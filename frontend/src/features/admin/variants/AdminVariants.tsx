import { useState } from 'react';
import { Palette, AlertCircle } from 'lucide-react';
// ...existing code...
import type { AdminProduct } from '../../../context/AdminProductsContext';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import { useAdminVariants } from '../../../context/AdminVariantsContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { logAdminActivity } from '../../../services/adminActivityLogService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminVariants.module.css';
import { ModalConfirm } from '../../../components/ui/ModalConfirm';
import { Notification } from '../../../components/ui/Notification';
import {
  ProductSelector,
  VariantHeader,
  VariantForm,
  VariantGroupsGrid,
} from './components';
import { VariantsFilters } from './components/VariantFilters';
import { useUnsavedChanges } from '../../../context/useUnsavedChanges';

export function AdminVariants() {
  // Estados para feedback UX
  const [notif, setNotif] = useState<{ open: boolean, type: 'success' | 'error', message: string }>({ open: false, type: 'success', message: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { products } = useAdminProducts();
  const {
    variants,
    selectedProductId,
    isLoading,
    error: apiError,
    loadVariants,
    addVariant,
    updateVariant,
    deleteVariant,
    toggleVariantStatus,
    addValueToVariant,
    removeValueFromVariant,
  } = useAdminVariants();
  const { can, user } = useAdminAuth();

  const [newGroupName, setNewGroupName] = useState('');
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const {
    isDirty,
    setIsDirty,
    showWarning,
    confirmNavigation,
    cancelNavigation,
  } = useUnsavedChanges();

  const dynamicFiltersConfig = variants.map((variant) => ({
    name: variant.name,
    values: variant.values,
  }));
  const [filters, setFilters] = useState<{
    search: string;
    status: "all" | "active" | "inactive";
    dynamic: Record<string, string>;
  }>({
    search: "",
    status: "all",
    dynamic: {},
  });

  const selectedProduct: AdminProduct | undefined = selectedProductId
    ? products.find(p => p.id === selectedProductId)
    : undefined;

  // ── Selección de producto ──────────────────────────────────────────
  const handleSelectProduct = async (productId: string) => {
    if (productId === selectedProductId) return;
    setNewGroupName('');
    setNewValues({});
    setErrors({});
    await loadVariants(productId);
  };

  // ── CRUD de grupos ────────────────────────────────────────────────
  const handleAddGroup = async () => {
    const name = newGroupName.trim();
    setErrors(prev => ({ ...prev, group: '' }));
    if (!selectedProductId) return;
    if (!name) return setErrors(prev => ({ ...prev, group: 'El nombre del grupo es obligatorio' }));
    const exists = variants.some(g => g.name.toLowerCase() === name.toLowerCase());
    if (exists) return setErrors(prev => ({ ...prev, group: 'Ya existe un grupo con ese nombre' }));
    try {
      await addVariant(selectedProductId, name);
      setNotif({ open: true, type: 'success', message: 'Variante creada correctamente.' });
      setNewGroupName('');
    } catch {
      setNotif({ open: true, type: 'error', message: 'Error al crear variante.' });
    }
  };

  const handleDeleteGroup = async (variantId: string) => {
    setPendingDeleteId(variantId);
    setModalOpen(true);
  };

  const handleCancelDelete = () => {
    setPendingDeleteId(null);
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProductId || !pendingDeleteId) return;
    setModalOpen(false);
    try {
      await deleteVariant(selectedProductId, pendingDeleteId);
      const userEmail = user ?? 'desconocido';
      logAdminActivity({
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: 'delete',
        entity: 'variant',
        entityId: pendingDeleteId,
        details: { productId: selectedProductId },
      });
      setNotif({ open: true, type: 'success', message: 'Variante eliminada correctamente.' });
    } catch {
      setNotif({ open: true, type: 'error', message: 'Error al eliminar variante.' });
    }
    setPendingDeleteId(null);
  };

  const handleEditGroupName = async (variantId: string, newName: string) => {
    try {
      if (selectedProductId) {
        await updateVariant(selectedProductId, variantId, { name: newName });
        setNotif({ open: true, type: 'success', message: 'Variante editada correctamente.' });
      }
    } catch {
      setNotif({ open: true, type: 'error', message: 'Error al editar variante.' });
    }
  };

  // Nuevas funciones para resolver errores de TS
  const handleDuplicateGroup = (group: any) => {
    console.log("Duplicando grupo:", group);
    // Aquí puedes implementar la lógica de duplicación más tarde
  };

  const handleOpenEditModal = (groupId: string) => {
    console.log("Abriendo modal para:", groupId);
    // Aquí puedes implementar la lógica del modal más tarde
  };

  // ── CRUD de valores ───────────────────────────────────────────────
  const handleAddValue = async (variantId: string, value: string) => {
    const val = value.trim();
    setErrors(prev => ({ ...prev, [`value-${variantId}`]: '' }));
    if (!selectedProductId) return;
    if (!val) return setErrors(prev => ({ ...prev, [`value-${variantId}`]: 'El valor es obligatorio' }));

    const group = variants.find(v => v.id === variantId);
    if (group?.values.some(v => v.toLowerCase() === val.toLowerCase())) {
      return setErrors(prev => ({ ...prev, [`value-${variantId}`]: 'Este valor ya existe en el grupo' }));
    }

    await addValueToVariant(selectedProductId, variantId, val);
    setNewValues(prev => ({ ...prev, [variantId]: '' }));
  };

  const handleRemoveValue = async (variantId: string, value: string) => {
    if (!selectedProductId) return;
    await removeValueFromVariant(selectedProductId, variantId, value);
  };

  const handleEditValue = async (variantId: string, oldValue: string, newValue: string) => {
    const newVal = newValue.trim();
    if (!selectedProductId) return;
    if (!newVal) {
      setNotif({ open: true, type: 'error', message: 'El valor no puede estar vacío' });
      return;
    }

    const group = variants.find(v => v.id === variantId);
    if (!group) return;

    if (group.values.some(v => v.toLowerCase() === newVal.toLowerCase() && v !== oldValue)) {
      setNotif({ open: true, type: 'error', message: 'Este valor ya existe en el grupo' });
      return;
    }

    try {
      const updatedVals = group.values.map(v => v === oldValue ? newVal : v);
      await updateVariant(selectedProductId, variantId, { values: updatedVals });
      setNotif({ open: true, type: 'success', message: 'Valor editado correctamente.' });
    } catch {
      setNotif({ open: true, type: 'error', message: 'Error al editar valor.' });
    }
  };

  const handleToggleStatus = async (variantId: string, newStatus: boolean) => {
    if (!selectedProductId) return;
    try {
      await toggleVariantStatus(selectedProductId, variantId, newStatus);
      const userEmail = user ?? 'desconocido';
      logAdminActivity({
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: 'update',
        entity: 'variant',
        entityId: variantId,
        details: { productId: selectedProductId, isActive: newStatus },
      });
    } catch {
      setNotif({ open: true, type: 'error', message: 'Error al cambiar estado de variante.' });
    }
  };

  const handleSetNewValue = (groupId: string, value: string) => {
    setNewValues(prev => ({ ...prev, [groupId]: value }));
    if (errors[`value-${groupId}`]) {
      setErrors(prev => ({ ...prev, [`value-${groupId}`]: '' }));
    }
  };

  // ── Exportación ────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!selectedProduct || variants.length === 0) {
      setNotif({ open: true, type: 'error', message: 'No hay variantes para exportar' });
      return;
    }
    const headers = ['Grupo', 'Valores'];
    const rows = variants.map(variant => [variant.name, variant.values.join('; ')]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `variantes-${selectedProduct.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    setNotif({ open: true, type: 'success', message: 'Variantes exportadas correctamente' });
  };

  const filteredVariants = variants.filter((variant) => {
    const matchesSearch = filters.search ? variant.name.toLowerCase().includes(filters.search.toLowerCase()) : true;
    const matchesStatus = filters.status === "all" ? true : filters.status === "active" ? variant.isActive : !variant.isActive;
    const matchesDynamic = Object.entries(filters.dynamic).every(([vName, vVal]) => {
      if (!vVal) return true;
      return variants.find(v => v.name === vName)?.values.includes(vVal);
    });
    return matchesSearch && matchesStatus && matchesDynamic;
  });

  return (
    <div className={`${sectionStyles.page} dark:bg-gray-900 dark:text-gray-100`}>
      <ModalConfirm
        open={modalOpen}
        title="¿Eliminar variante?"
        description="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      <Notification
        open={notif.open}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif(prev => ({ ...prev, open: false }))}
      />
      <div className={sectionStyles.header}>
        <p className={sectionStyles.subtitle}>
          Definí grupos de variantes por producto (ej: Color, Tamaño) y gestioná sus valores.
        </p>
      </div>

      <div className={styles.layout}>
        <ProductSelector
          products={products}
          selectedProductId={selectedProductId}
          onSelectProduct={handleSelectProduct}
          variants={variants}
        />

        <main className={styles.content}>
          {isLoading ? (
            <div className={sectionStyles.loadingContainer}>
              <LoadingSpinner size="lg" message="Cargando variantes..." />
            </div>
          ) : !selectedProduct ? (
            <EmptyState
              icon={<Palette size={48} />}
              title="No hay producto seleccionado"
              description="Seleccioná un producto del panel izquierdo."
            />
          ) : (
            <>
              {apiError && (
                <div className={sectionStyles.errorState}>
                  <AlertCircle size={20} />
                  <p>Error: {apiError}</p>
                </div>
              )}

              <VariantHeader
                selectedProduct={selectedProduct}
                groupCount={filteredVariants.length}
              />

              <VariantForm
                newGroupName={newGroupName}
                setNewGroupName={setNewGroupName}
                onAddGroup={handleAddGroup}
                error={errors.group || ''}
                canCreate={can('variants.create')}
              />

              <div className={styles.filtersActionsBar}>
                <VariantsFilters
                  filters={filters}
                  variantsConfig={dynamicFiltersConfig}
                  onChange={setFilters}
                  onReset={() => setFilters({ search: '', status: 'all', dynamic: {} })}
                />
                {variants.length > 0 && (
                  <div className={styles.exportSection}>
                    <button className={styles.exportButton} onClick={handleExportCSV}>📥 Exportar CSV</button>
                  </div>
                )}
              </div>

              {filteredVariants.length === 0 ? (
                <EmptyState icon={<AlertCircle size={40} />} title="No hay resultados" description="Probá con otros filtros." />
              ) : (
                <VariantGroupsGrid
                  groups={filteredVariants}
                  onEditName={handleEditGroupName}
                  onDelete={handleDeleteGroup}
                  onEditValue={handleEditValue}
                  onToggleStatus={handleToggleStatus}
                  onAddValue={handleAddValue}
                  onRemoveValue={handleRemoveValue}
                  canEdit={can('variants.edit')}
                  canDelete={can('variants.delete')}
                  newValues={newValues}
                  setNewValue={handleSetNewValue}
                  errors={errors}
                  isPendingNavigation={isDirty}
                  setIsDirty={setIsDirty}
                  onDuplicate={handleDuplicateGroup}    // <-- PROP AGREGADA
                  onOpenEditModal={handleOpenEditModal}  // <-- PROP AGREGADA
                />
              )}
              {showWarning && (
                <ModalConfirm
                  title="Cambios no guardados"
                  description="¿Querés salir sin guardar?"
                  confirmText="Salir"
                  cancelText="Cancelar"
                  open={showWarning}
                  onConfirm={confirmNavigation}
                  onCancel={cancelNavigation}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}