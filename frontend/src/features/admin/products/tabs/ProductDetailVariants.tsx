import { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { validateCombination } from '../../../../utils/productFormUtils';
import type { CombinationValidationErrors } from '../../../../utils/productFormUtils';
import styles from './ProductDetailVariants.module.css';
import commonStyles from '../AdminProductFormPage.module.css'; 
import { ImageUploader, ImagePreviewList, useImageUpload } from '../../images';
import type { UploadFileState } from '../../images';
import { getStoredToken } from '../../../../utils/apiClient';
import { useAdminVariants } from '../../../../hooks/useAdminVariants';
import { useAdminProducts } from '../../../../context/useAdminProductsContext';
import { VariantForm } from '../../variants/components/VariantForm';
import { VariantEditModal } from '../../variants/components/VariantEditModal';
import { CombinationsTable } from '../../variants/components/CombinationTable';
import { ModalConfirm } from '../../../../components/ui/ModalConfirm/ModalConfirm';
import { Modal } from '../../../../components/ui/Modal';

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
    addValueToVariant,
    removeValueFromVariant,
    createVariantChild,
    skus,
    loadSkus,
    updateVariantChild,
    deleteVariantChild,
  } = useAdminVariants();

  const { getProduct } = useAdminProducts();
  const [newGroupName, setNewGroupName] = useState('');
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado de carga para UX del Modal
  const [isSubmittingCombo, setIsSubmittingCombo] = useState(false);

  // Modal avanzado de nombres/valores
  const [editModal, setEditModal] = useState<{ open: boolean; groupId: string | null }>({ open: false, groupId: null });
  const [editModalData, setEditModalData] = useState<{ name: string; values: string[] }>({ name: '', values: [] });

  const product = getProduct(productId);

  const lastLoadedProductRef = useRef<string | null>(null);
  useEffect(() => {
    if (!productId) return;
    if (lastLoadedProductRef.current === productId) return;
    lastLoadedProductRef.current = productId;
    loadVariants(productId);
    loadSkus(productId);
  }, [productId, loadVariants, loadSkus]);

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      setErrors(e => ({ ...e, group: 'El nombre es requerido' }));
      return;
    }
    try {
      await addVariant(productId, newGroupName.trim());
      setNewGroupName('');
      setErrors(e => ({ ...e, group: '' }));
    } catch {
      setErrors(e => ({ ...e, group: 'Error al crear grupo' }));
    }
  };

  const handleDelete = async (id: string) => {
    await deleteVariant(productId, id);
  };

  const handleAddValue = async (groupId: string, value: string) => {
    if (!value.trim()) return;
    await addValueToVariant(productId, groupId, value.trim());
    setNewValues(v => ({ ...v, [groupId]: '' }));
  };

  const handleRemoveValue = async (groupId: string, value: string) => {
    await removeValueFromVariant(productId, groupId, value);
  };

  const handleOpenEditModal = (groupId: string) => {
    const group = variants.find((v) => v.id === groupId);
    if (!group) return;
    setEditModalData({ name: group.name, values: group.values });
    setEditModal({ open: true, groupId });
  };

  const handleSaveEditModal = async (name: string, values: string[]) => {
    if (!editModal.groupId) return;
    await updateVariant(productId, editModal.groupId, { name, values });
    setEditModal({ open: false, groupId: null });
  };

  // --- Modal Combination ---
  const [combinationModalOpen, setCombinationModalOpen] = useState(false);
  const [combinationSku, setCombinationSku] = useState('');
  const [combinationStock, setCombinationStock] = useState<number | ''>('');
  const [combinationImages, setCombinationImages] = useState<string>('');
  const [combinationPrice, setCombinationPrice] = useState<number | ''>('');
  const [combinationAttrs, setCombinationAttrs] = useState<Record<string, string>>({});
  const [combinationErrors, setCombinationErrors] = useState<CombinationValidationErrors>({});

  // --- Modal de confirmación de generación masiva ---
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [combosToCreate, setCombosToCreate] = useState<
    { sku?: string; attributes: Record<string, string>; price?: number; stock?: number }[]
  >([]);

  // Estados para el Modal de Confirmación de Eliminación Individual
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [skuToDeleteId, setSkuToDeleteId] = useState<string | null>(null);

  // Estado optimista para eliminación inmediata (0ms percibidos en UI)
  const [deletedSkuIds, setDeletedSkuIds] = useState<Set<string>>(new Set());

  type CreatedCombination = { id?: string; sku?: string; attributes: Record<string, string>; stock?: number; images?: string[]; price?: number };
  const [createdCombinations, setCreatedCombinations] = useState<CreatedCombination[]>([]);
  const [editingSkuId, setEditingSkuId] = useState<string | null>(null);

  const token = getStoredToken() ?? '';
  const { files: uploadedFiles, addFiles, remove: removeFile, setPrimary, uploadAll, retry, setFiles } = useImageUpload({ token, productId, skuId: editingSkuId ?? undefined });

  useEffect(() => {
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    const hasPrimary = uploadedFiles.some(f => f.isPrimary);
    if (!hasPrimary) {
      const first = uploadedFiles[0];
      if (first) setPrimary(first.uid);
    }
  }, [uploadedFiles, setPrimary]);

  // SKU Automático Reactivo
  useEffect(() => {
    if (combinationModalOpen && !editingSkuId && product?.sku) {
      const attrValues = Object.values(combinationAttrs).filter(Boolean);
      if (attrValues.length > 0) {
        const suffix = attrValues.map(v => v.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()).join('-');
        const generatedSku = `${product.sku}-${suffix}`;
        setCombinationSku(generatedSku);

        if (generatedSku && !/[^A-Z0-9-]/.test(generatedSku)) {
          setCombinationErrors(prev => {
            const next = { ...prev };
            delete next.sku;
            return next;
          });
        }
      } else {
        setCombinationSku(`${product.sku}-`);
      }
    }
  }, [combinationAttrs, combinationModalOpen, editingSkuId, product?.sku]);

  const runCombinationValidation = useCallback(() => {
    let imagesInput: unknown = combinationImages;
    if (!combinationImages.trim()) {
      if (uploadedFiles && uploadedFiles.length > 0) {
        imagesInput = uploadedFiles.map(f => f.remoteUrl ?? f.previewUrl ?? f.uid);
      } else {
        imagesInput = '';
      }
    }

    const result = validateCombination({ sku: combinationSku, skuBase: product?.sku, images: imagesInput, price: combinationPrice });
    setCombinationErrors(result);
    return result;
  }, [combinationSku, combinationImages, combinationPrice, product?.sku, uploadedFiles]);

  const openCombinationModal = () => {
    const initial: Record<string, string> = {};
    variants.forEach(v => {
      initial[v.name] = '';
    });
    setCombinationAttrs(initial);
    setCombinationStock('');
    setCombinationImages('');

    setCombinationPrice(product?.price && product.price > 0 ? product.price : '');
    setCombinationSku(product?.sku ? `${product.sku}-` : '');

    setEditingSkuId(null);
    setCombinationErrors({});
    try {
      setFiles([] as UploadFileState[]);
    } catch {
      // ignore
    }
    setCombinationModalOpen(true);
  };

  const handleBulkGenerate = async () => {
    if (!productId) return;
    if (!variants || variants.length === 0) {
      toast.error('Agregá al menos un grupo de variantes con valores.');
      return;
    }

    const variantNames = variants.map(g => g.name);
    const variantValuesLists = variants.map(g => g.values);

    if (variantValuesLists.some(list => list.length === 0)) {
      toast.error('Todos los grupos de variantes deben tener al menos un valor cargado.');
      return;
    }

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>((a, b) =>
        a.flatMap(d => b.map(e => [...d, e])),
        [[]]
      );
    };

    const allCombos = cartesian(variantValuesLists);
    const newCombosToCreate: { sku?: string; attributes: Record<string, string>; price?: number; stock?: number }[] = [];

    for (const combo of allCombos) {
      const attrs: Record<string, string> = {};
      combo.forEach((val, idx) => {
        attrs[variantNames[idx]] = val;
      });

      const exists = skus.some((s) => {
        const sAttrs = s.attributes || {};
        const keys1 = Object.keys(attrs);
        const keys2 = Object.keys(sAttrs);
        if (keys1.length !== keys2.length) return false;
        return keys1.every(k => sAttrs[k] === attrs[k]);
      });

      if (!exists) {
        const suffix = combo.map(v => v.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()).join('-');
        const sku = product?.sku ? `${product.sku}-${suffix}` : suffix;

        newCombosToCreate.push({
          sku,
          attributes: attrs,
          price: product?.price && product.price > 0 ? product.price : undefined,
          stock: 0,
        });
      }
    }

    if (newCombosToCreate.length === 0) {
      toast.success('Todas las combinaciones posibles ya fueron generadas.');
      return;
    }

    setCombosToCreate(newCombosToCreate);
    setBulkConfirmOpen(true);
  };

  const executeBulkGenerate = async () => {
    if (!productId || combosToCreate.length === 0) return;
    setBulkConfirmOpen(false);

    setCreatedCombinations(prev => [...combosToCreate, ...prev]);
    const loadingToast = toast.loading(`Generando ${combosToCreate.length} combinaciones...`);

    try {
      for (const combo of combosToCreate) {
        await createVariantChild(productId, combo);
      }
      await loadSkus(productId);
      toast.success('Combinaciones generadas con éxito', { id: loadingToast });
    } catch (err) {
      console.error('Error creando la combinación', err);
      toast.error('Ocurrió un error al generar las combinaciones', { id: loadingToast });
    } finally {
      setCombosToCreate([]);
    }
  };

  const handleCreateCombination = async () => {
    if (!productId) return;
    
    setIsSubmittingCombo(true);

    const attrs = { ...combinationAttrs };
    const sku = combinationSku.trim();
    const stock = combinationStock === '' ? undefined : Number(combinationStock);
    let images = undefined as string[] | undefined;
    const raw = combinationImages.trim();
    
    if (raw) {
      if (raw.includes('\n')) images = raw.split('\n').map(s => s.trim()).filter(Boolean);
      else images = [raw];
    }
    
    const price = combinationPrice === '' ? undefined : Number(combinationPrice);

    const validation = runCombinationValidation();
    if (validation && (validation.sku || validation.images || validation.price)) {
      setIsSubmittingCombo(false);
      return;
    }

    setCombinationModalOpen(false);
    setEditingSkuId(null);
    setCombinationAttrs({});
    setCombinationSku('');
    setCombinationPrice('');
    setCombinationStock('');
    setCombinationImages('');

    const optimisticCombo: CreatedCombination = { 
        sku: sku || undefined, 
        attributes: attrs, 
        stock, 
        images: uploadedFiles.map(f => f.remoteUrl || f.previewUrl).filter(Boolean) as string[], 
        price 
    };
    setCreatedCombinations(prev => [optimisticCombo, ...prev]);

    try {
      let persistedSkuId: string | undefined = undefined;
      
      if (editingSkuId) {
        persistedSkuId = editingSkuId;
      } else {
        const created = await createVariantChild(productId, { sku: sku || undefined, attributes: attrs, stock, price });
        if (created && typeof created === 'object' && (created as Record<string, unknown>).id) {
          persistedSkuId = String((created as Record<string, unknown>).id);
        }
      }

      let uploadedRemoteUrls: string[] = [];
      if (persistedSkuId && uploadedFiles.length > 0) {
        const results = await uploadAll(persistedSkuId);
        uploadedRemoteUrls = results.filter(r => r.status === 'success' && r.url).map(r => r.url!) as string[];
      }

      if (images && Array.isArray(images)) {
        images = [...uploadedRemoteUrls, ...images];
      } else if (uploadedRemoteUrls.length > 0) {
        images = uploadedRemoteUrls;
      } else {
        images = undefined;
      }

      if (persistedSkuId) {
        await updateVariantChild(productId, persistedSkuId, { images, price, stock, sku: sku || undefined, attributes: attrs });
      }

      setFiles([]);
      toast.success(editingSkuId ? 'Combinación actualizada' : 'Combinación creada con éxito');
      
      await loadSkus(productId);
      
    } catch(err) {
      console.error('Error al guardar variante:', err);
      toast.error('Ocurrió un error al guardar la combinación');
      setCreatedCombinations(prev => prev.filter(c => c.sku !== sku));
    } finally {
      setIsSubmittingCombo(false);
    }
  };

  useEffect(() => {
    if (!skus || skus.length === 0) return;
    setCreatedCombinations(prev => prev.filter(local => {
      if (!local.sku) return true;
      return !skus.some((s) => (local.id && s.id === local.id) || (local.sku && s.sku === local.sku));
    }));
  }, [skus]);

  const handleEditCombination = (id: string) => {
    const sku = skus.find(s => s.id === id);
    if (!sku) return;
    setCombinationAttrs(sku.attributes || {});
    setCombinationSku(sku.sku ?? '');
    setCombinationStock(typeof sku.stock === 'number' ? sku.stock : '');
    setCombinationPrice(typeof sku.price === 'number' ? sku.price : '');
    setCombinationImages(Array.isArray(sku.images) ? sku.images.join('\n') : '');
    setEditingSkuId(id);
    if (Array.isArray(sku.images) && sku.images.length > 0) {
      const initial: UploadFileState[] = sku.images.map((url) => ({ uid: `remote-${Math.random().toString(36).slice(2, 8)}`, previewUrl: url, remoteUrl: url, status: 'success' } as UploadFileState));
      setFiles(initial);
    } else {
      setFiles([] as UploadFileState[]);
    }
    setCombinationModalOpen(true);
  };

  const handleDeleteCombination = (id: string) => {
    setSkuToDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const executeDeleteCombination = async () => {
    if (!productId || !skuToDeleteId) return;
    setDeleteConfirmOpen(false);

    setDeletedSkuIds(prev => new Set([...prev, skuToDeleteId]));

    try {
      await deleteVariantChild(productId, skuToDeleteId);
      toast.success('Combinación eliminada correctamente');
    } catch {
      setDeletedSkuIds(prev => {
        const next = new Set(prev);
        next.delete(skuToDeleteId);
        return next;
      });
      toast.error('No se pudo eliminar la combinación');
    } finally {
      setSkuToDeleteId(null);
    }
  };

  const visibleSkus = (skus || []).filter((s) => !deletedSkuIds.has(s.id));

  return (
    <div className={styles.container}>
      {/* ── 1. OPCIONES DEL PRODUCTO (REDISEÑO EN FILA HORIZONTAL) ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionStep}>1</span>
          <div>
            <h2 className={styles.sectionTitle}>Opciones del producto</h2>
            <p className={styles.sectionDesc}>
              Definí los grupos de variantes (ej. Color, Talle) y sus valores de forma compacta.
            </p>
          </div>
        </div>
        
        {/* Selector de nuevo grupo */}
        <VariantForm
          newGroupName={newGroupName}
          setNewGroupName={setNewGroupName}
          onAddGroup={handleAddGroup}
          error={errors.group || ''}
          canCreate={true}
        />

        {/* 🟢 RENDERIZADO EN FILA HORIZONTAL DE CHIPS (IGUAL A TABVARIANTES) */}
        <div className={styles.attributesList}>
          {variants.map((group) => (
            <div key={group.id} className={styles.variantRow}>
              
              {/* Etiqueta del Atributo */}
              <div className={styles.variantLabelBlock}>
                <span className={styles.variantGroupName}>
                  {group.name}
                </span>
                <button
                  type="button"
                  className={styles.compactEditBtn}
                  onClick={() => handleOpenEditModal(group.id)}
                  title={`Editar grupo ${group.name}`}
                >
                  📝
                </button>
              </div>

              {/* Contenedor de Chips horizontal flexible sin desborde */}
              <div className={styles.tagsContainer}>
                {group.values.map((val: string) => (
                  <span key={val} className={styles.tagChip}>
                    {val}
                    <button
                      type="button"
                      className={styles.tagRemoveBtn}
                      onClick={() => handleRemoveValue(group.id, val)}
                      aria-label={`Eliminar variante ${val}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Input compacto alineado */}
              <div className={styles.addValueInputBlock}>
                <input
                  className={styles.compactInput}
                  value={newValues[group.id] ?? ''}
                  onChange={e => setNewValues(v => ({ ...v, [group.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddValue(group.id, newValues[group.id] ?? ''))}
                  placeholder={`Añadir...`}
                />
                <button
                  type="button"
                  className={styles.compactAddBtn}
                  onClick={() => handleAddValue(group.id, newValues[group.id] ?? '')}
                  aria-label={`Agregar valor a ${group.name}`}
                >
                  +
                </button>
              </div>

              {/* Botón borrar grupo entero */}
              <button
                type="button"
                className={styles.deleteGroupBtn}
                onClick={() => handleDelete(group.id)}
                aria-label={`Eliminar grupo ${group.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {variants.length === 0 && (
          <p className={styles.emptyPlaceholder}>
            No hay grupos de variantes. Creá uno arriba.
          </p>
        )}

        <VariantEditModal
          open={editModal.open}
          initialName={editModalData.name}
          initialValues={editModalData.values}
          onClose={() => setEditModal({ open: false, groupId: null })}
          onSave={handleSaveEditModal}
        />
      </section>

      {/* ── 2. COMBINACIONES ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionStep}>2</span>
          <div>
            <h2 className={styles.sectionTitle}>Combinaciones</h2>
            <p className={styles.sectionDesc}>
              Cada combinación es un SKU vendible con su precio, stock e imágenes propias.
            </p>
          </div>
        </div>

        <div className={styles.combinationsToolbar}>
          <button
            type="button"
            className={styles.bulkGenerateBtn}
            onClick={handleBulkGenerate}
            disabled={!productId || variants.length === 0}
          >
            ⚡ Generar matriz de combinaciones
          </button>
          <button
            type="button"
            onClick={openCombinationModal}
            className={styles.addCombinationBtn}
            disabled={!productId}
          >
            + Agregar a mano
          </button>
        </div>

        {(!productId) && (
          <p className={commonStyles.fieldHint} style={{ marginTop: '4px' }}>
            Guardá el producto primero para poder crear combinaciones.
          </p>
        )}

        <CombinationsTable
          skus={visibleSkus}
          localCombinations={createdCombinations}
          onEdit={handleEditCombination}
          onDelete={handleDeleteCombination}
        />
      </section>

      {/* Modal oficial */}
      <Modal
        open={combinationModalOpen}
        onClose={() => setCombinationModalOpen(false)}
        title={editingSkuId ? 'Editar combinación' : 'Añadir combinación'}
        disableClose={isSubmittingCombo}
        size="md"
        actions={
          <>
            <button 
              type="button" 
              className={styles.cancelBtn} 
              disabled={isSubmittingCombo} 
              onClick={() => setCombinationModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={handleCreateCombination}
              disabled={isSubmittingCombo || !!(combinationErrors.sku || combinationErrors.images || combinationErrors.price)}
            >
              {isSubmittingCombo ? 'Guardando...' : (editingSkuId ? 'Guardar cambios' : 'Crear')}
            </button>
          </>
        }
      >
        <div className={styles.modalFieldsContainer}>
          {(!variants || variants.length === 0) && (
            <p className={commonStyles.fieldHint}>No hay grupos de variantes para seleccionar.</p>
          )}

          {variants.map((group) => (
            <div key={group.id} className={styles.field}>
              <label className={styles.label}>{group.name}</label>
              <select
                className={styles.input}
                value={combinationAttrs[group.name] ?? ''}
                onChange={e => setCombinationAttrs(prev => ({ ...prev, [group.name]: e.target.value }))}
              >
                <option value="">-- Seleccionar --</option>
                {group.values.map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
          ))}

          <div className={styles.field}>
            <label htmlFor="combination-sku" className={styles.label}>SKU *</label>
            <input
              id="combination-sku"
              className={`${styles.input} ${combinationErrors.sku ? styles.inputError : ''}`}
              value={combinationSku}
              onChange={e => { setCombinationSku(e.target.value); runCombinationValidation(); }}
              onBlur={() => runCombinationValidation()}
            />
            {combinationErrors.sku && <div className={styles.errorText}>{combinationErrors.sku}</div>}
          </div>

          <div className={styles.field}>
            <label htmlFor="combination-images" className={styles.label}>Imágenes</label>
            <div style={{ marginTop: '8px' }}>
              <ImageUploader onAddFiles={addFiles} />
              <ImagePreviewList
                items={uploadedFiles}
                onRemove={removeFile}
                onRetry={retry}
                onSetPrimary={setPrimary}
              />
            </div>
            {combinationErrors.images && <div className={styles.errorText}>{combinationErrors.images}</div>}
          </div>

          <div className={styles.modalRowFields}>
            <div className={styles.field}>
              <label htmlFor="combination-price" className={styles.label}>Precio</label>
              <input
                id="combination-price"
                type="number"
                step="0.01"
                className={`${styles.input} ${combinationErrors.price ? styles.inputError : ''}`}
                value={combinationPrice === '' ? '' : String(combinationPrice)}
                onChange={e => {
                  setCombinationPrice(e.target.value === '' ? '' : Number(e.target.value));
                  runCombinationValidation();
                }}
                onBlur={() => runCombinationValidation()}
              />
              {combinationErrors.price && <div className={styles.errorText}>{combinationErrors.price}</div>}
            </div>

            <div className={styles.field}>
              <label htmlFor="combination-stock" className={styles.label}>Stock</label>
              <input
                id="combination-stock"
                type="number"
                className={styles.input}
                value={combinationStock === '' ? '' : String(combinationStock)}
                onChange={e => setCombinationStock(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmación de Generación Masiva */}
      <ModalConfirm
        open={bulkConfirmOpen}
        title="Generar combinaciones"
        description={`Se generarán ${combosToCreate.length} combinaciones nuevas. El precio se hereda del producto principal y el stock inicial será 0. ¿Continuar?`}
        confirmText="Aceptar"
        cancelText="Cancelar"
        onConfirm={executeBulkGenerate}
        onCancel={() => {
          setBulkConfirmOpen(false);
          setCombosToCreate([]);
        }}
      />

      {/* Modal de Confirmación para Eliminar Combinación Individual */}
      <ModalConfirm
        open={deleteConfirmOpen}
        title="Eliminar combinación"
        description="¿Estás seguro de que deseas eliminar esta combinación? Esta acción no se puede deshacer."
        confirmText="Aceptar"
        cancelText="Cancelar"
        onConfirm={executeDeleteCombination}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setSkuToDeleteId(null);
        }}
      />
    </div>
  );
}