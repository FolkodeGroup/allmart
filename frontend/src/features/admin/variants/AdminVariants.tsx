
import { useState } from 'react';
import { Palette, AlertCircle, HelpCircle } from 'lucide-react';
import Tooltip from '@mui/material/Tooltip';
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

export function AdminVariants() {
    // Estados para feedback UX
    const [notif, setNotif] = useState<{open:boolean,type:'success'|'error',message:string}>({open:false,type:'success',message:''});
    const [modalOpen, setModalOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string|null>(null);
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
    addValueToVariant,
    removeValueFromVariant,
  } = useAdminVariants();
  const { can, user } = useAdminAuth();

  const [newGroupName, setNewGroupName] = useState('');
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      setNotif({open:true,type:'success',message:'Variante creada correctamente.'});
      setNewGroupName('');
    } catch {
      setNotif({open:true,type:'error',message:'Error al crear variante.'});
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
      setNotif({open:true,type:'success',message:'Variante eliminada correctamente.'});
    } catch {
      setNotif({open:true,type:'error',message:'Error al eliminar variante.'});
    }
    setPendingDeleteId(null);
  };

  const handleEditGroupName = async (variantId: string, newName: string) => {
    try {
      if (selectedProductId) {
        await updateVariant(selectedProductId, variantId, { name: newName });
        setNotif({open:true,type:'success',message:'Variante editada correctamente.'});
      }
    } catch {
      setNotif({open:true,type:'error',message:'Error al editar variante.'});
    }
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

  const handleSetNewValue = (groupId: string, value: string) => {
    setNewValues(prev => ({ ...prev, [groupId]: value }));
    if (errors[`value-${groupId}`]) {
      setErrors(prev => ({ ...prev, [`value-${groupId}`]: '' }));
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className={sectionStyles.page}>
      <ModalConfirm
        open={modalOpen}
        title="¿Eliminar variante?"
        description="Esta acción no se puede deshacer. Se eliminarán todos los valores asociados."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      <Notification
        open={notif.open}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif(prev => ({...prev,open:false}))}
      />
      <div className={sectionStyles.header}>
        <span className={sectionStyles.label}>Administración</span>
        <h1 className={sectionStyles.title}>
          <span>🎨</span> Variantes
          <Tooltip
            title="Las variantes permiten definir atributos de productos como color, tamaño o material. Cada variante tiene un nombre (ej: 'Color') y valores asociados (ej: 'Rojo', 'Azul'). Los clientes pueden seleccionar combinaciones de variantes al comprar."
            placement="right"
            arrow
          >
            <HelpCircle size={20} className={styles.helpIcon} />
          </Tooltip>
        </h1>
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
              description="Seleccioná un producto del panel izquierdo para gestionar sus variantes."
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
                groupCount={variants.length}
              />

              <VariantForm
                newGroupName={newGroupName}
                setNewGroupName={setNewGroupName}
                onAddGroup={handleAddGroup}
                error={errors.group || ''}
                canCreate={can('variants.create')}
              />

              <VariantGroupsGrid
                groups={variants}
                onEditName={handleEditGroupName}
                onDelete={handleDeleteGroup}
                onAddValue={handleAddValue}
                onRemoveValue={handleRemoveValue}
                canEdit={can('variants.edit')}
                canDelete={can('variants.delete')}
                newValues={newValues}
                setNewValue={handleSetNewValue}
                errors={errors}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
