import { useEffect, useState, useRef, useCallback } from 'react';
import { validateCombination } from '../../../../utils/productFormUtils';
import type { CombinationValidationErrors } from '../../../../utils/productFormUtils';
import styles from './ProductDetailVariants.module.css';
import { ImageUploader, ImagePreviewList, useImageUpload } from '../../images';
import type { UploadFileState } from '../../images';
import { getStoredToken } from '../../../../utils/apiClient';
import { useAdminVariants } from '../../../../context/AdminVariantsContext';
import { useAdminProducts } from '../../../../context/useAdminProductsContext';
import { VariantGroupsGrid } from '../../variants/components/VariantGroupsGrid';
import { VariantForm } from '../../variants/components/VariantForm';
import { VariantEditModal } from '../../variants/components/VariantEditModal';
import { CombinationsTable } from '../../variants/components/CombinationTable';

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

  // Modal avanzado
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Handlers para acciones inline
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

  const handleEditName = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    await updateVariant(productId, id, { name: newName.trim() });
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

  const handleEditValue = async (groupId: string, oldValue: string, newValue: string) => {
    if (!newValue.trim()) return;
    const group = variants.find((v) => v.id === groupId);
    if (!group) return;
    const values = group.values.map((val: string) => (val === oldValue ? newValue.trim() : val));
    await updateVariant(productId, groupId, { values });
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

  // --- New: Create variant combination (SKU + attributes + stock)
  const [combinationModalOpen, setCombinationModalOpen] = useState(false);
  const [combinationSku, setCombinationSku] = useState('');
  const [combinationStock, setCombinationStock] = useState<number | ''>('');
  const [combinationImages, setCombinationImages] = useState<string>('');
  const [combinationPrice, setCombinationPrice] = useState<number | ''>('');
  const [combinationAttrs, setCombinationAttrs] = useState<Record<string, string>>({});
  const [combinationErrors, setCombinationErrors] = useState<CombinationValidationErrors>({});
  type CreatedCombination = { id?: string; sku?: string; attributes: Record<string, string>; stock?: number; images?: string[]; price?: number };
  const [createdCombinations, setCreatedCombinations] = useState<CreatedCombination[]>([]);
  const [editingSkuId, setEditingSkuId] = useState<string | null>(null);
  // Image upload hook for combinations (product-level by default)
  const token = getStoredToken() ?? '';
  const { files: uploadedFiles, addFiles, remove: removeFile, setPrimary, uploadAll, retry, setFiles } = useImageUpload({ token, productId, skuId: editingSkuId ?? undefined });
  // whether user manually provided URLs in the textarea
  // (kept as a comment — validation is handled later after uploads)

  // Ensure the first uploaded image is marked as primary by default
  useEffect(() => {
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    const hasPrimary = uploadedFiles.some(f => f.isPrimary);
    if (!hasPrimary) {
      const first = uploadedFiles[0];
      if (first) setPrimary(first.uid);
    }
  }, [uploadedFiles, setPrimary]);

  useEffect(() => {
    if (product && product.sku) {
      // prefill sku base, actual initials will be appended when user focuses input
      setCombinationSku(product.sku + '-');
    }
  }, [product]);

  // Validate the current combination inputs and update combinationErrors
  const runCombinationValidation = useCallback(() => {
    // If user provided newline URLs, pass them through. Otherwise, if there are uploaded files (local or remote),
    // treat that as having images so validation passes.
    let imagesInput: unknown = combinationImages;
    if (!combinationImages.trim()) {
      if (uploadedFiles && uploadedFiles.length > 0) {
        // provide a non-empty array so validateCombination sees images present
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
    // initialize attributes with empty values (no defaults)
    const initial: Record<string, string> = {};
    variants.forEach(v => {
      initial[v.name] = '';
    });
    setCombinationAttrs(initial);
    setCombinationStock('');
    setCombinationImages('');
    setCombinationPrice('');
    // ensure we are in create mode (no editing SKU) and clear any staged files
    setEditingSkuId(null);
    try {
      setFiles([] as UploadFileState[]);
    } catch {
      // ignore if hook not available
    }
    setCombinationModalOpen(true);
  };

  const handleCreateCombination = async () => {
    const attrs = { ...combinationAttrs };
    const sku = combinationSku.trim();
    const stock = combinationStock === '' ? undefined : Number(combinationStock);
    // Prefer newline-separated URLs to avoid splitting valid URLs that contain commas/semicolons in query strings.
    let images = undefined as string[] | undefined;
    const raw = combinationImages.trim();
    if (raw) {
      if (raw.includes('\n')) images = raw.split('\n').map(s => s.trim()).filter(Boolean);
      else images = [raw];
    }
    const price = combinationPrice === '' ? undefined : Number(combinationPrice);

    // Run validation and prevent submit if errors
    const validation = runCombinationValidation();
    if (validation && (validation.sku || validation.images || validation.price)) {
      // keep modal open and show errors
      return;
    }

    // Create or update SKU first (so we have an SKU id to upload files into storage if needed)
    let persistedSkuId: string | undefined = undefined;
    if (editingSkuId) {
      await updateVariantChild(productId, editingSkuId, { sku: sku || undefined, attributes: attrs, stock, price });
      persistedSkuId = editingSkuId;
    } else {
      const created = await createVariantChild(productId, { sku: sku || undefined, attributes: attrs, stock, price });
      if (created && typeof created === 'object' && (created as Record<string, unknown>).id) {
        persistedSkuId = String((created as Record<string, unknown>).id);
      }
    }

    // If we have a persisted SKU id, upload pending files into SKU storage and collect URLs
    let uploadedRemoteUrls: string[] = [];
    if (persistedSkuId) {
      const results = await uploadAll(persistedSkuId);
      uploadedRemoteUrls = results.filter(r => r.status === 'success' && r.url).map(r => r.url!) as string[];
    }

    // Combine any user-provided URLs with uploaded ones
    if (images && Array.isArray(images)) {
      images = [...uploadedRemoteUrls, ...images];
    } else if (uploadedRemoteUrls.length > 0) {
      images = uploadedRemoteUrls;
    } else {
      images = undefined;
    }

    // If we have a persisted SKU, ensure images are attached via updateVariantChild
    try {
      if (persistedSkuId) {
        // include attributes to avoid accidental overwrite on backend merge
        await updateVariantChild(productId, persistedSkuId, { images, price, attributes: attrs });
      } else if (!editingSkuId) {
        // No persisted id returned — fall back to optimistic local entry
        const newItem: CreatedCombination = { sku: sku || undefined, attributes: attrs, stock, images, price };
        setCreatedCombinations(prev => [newItem, ...prev]);
      } else {
        // Editing existing but no persistedSkuId (shouldn't happen) — still attempt to update
        if (editingSkuId) await updateVariantChild(productId, editingSkuId, { images, price, attributes: attrs });
      }
    } finally {
      setCombinationModalOpen(false);
      setEditingSkuId(null);
    }
  };

  // Remove optimistic created combinations when the persisted `skus` list contains them
  useEffect(() => {
    if (!skus || skus.length === 0) return;
    setCreatedCombinations(prev => prev.filter(local => {
      // if local has no sku, keep it
      if (!local.sku) return true;
      // remove if a persisted sku with same sku string or id exists
      return !skus.some(s => (local.id && s.id === local.id) || (local.sku && s.sku === local.sku));
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
    // Prefill image previews from existing SKU images (remote URLs)
    if (Array.isArray(sku.images) && sku.images.length > 0) {
      const initial: UploadFileState[] = sku.images.map((url) => ({ uid: `remote-${Math.random().toString(36).slice(2, 8)}`, previewUrl: url, remoteUrl: url, status: 'success' } as UploadFileState));
      setFiles(initial);
    } else {
      setFiles([] as UploadFileState[]);
    }
    setCombinationModalOpen(true);
  };

  const handleDeleteCombination = async (id: string) => {
    if (!window.confirm('¿Eliminar esta combinación?')) return;
    try {
      await deleteVariantChild(productId, id);
    } catch {
      // Error handled silently
    }
  };

  return (
    <div className={styles.container}>
      {/* ── 1. Opciones del producto ── */}
      <section className={styles.section}>

        {/*{product && (
          <VariantHeader selectedProduct={product} groupCount={variants.length} />
        )}*/}
        <div className={styles.sectionHeading}>
          <span className={styles.sectionStep}>1</span>
          <div>
            <h2 className={styles.sectionTitle}>Opciones del producto</h2>
            <p className={styles.sectionDesc}>
              Definí los grupos de variantes (ej. Color, Talle) y sus valores posibles.
            </p>
          </div>
        </div>
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
          onEditValue={handleEditValue}
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

      {/* ── 2. Combinaciones ── */}
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
            onClick={openCombinationModal}
            className={styles.addCombinationBtn}
          >
            + Nueva combinación
          </button>
        </div>

        <CombinationsTable
          skus={skus}
          localCombinations={createdCombinations}
          onEdit={handleEditCombination}
          onDelete={handleDeleteCombination}
        />
      </section>

      {/* ── Modal de combinación (sin cambios) ── */}
      {combinationModalOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3>{editingSkuId ? 'Editar combinación' : 'Añadir combinación'}</h3>
            {variants.length === 0 && (
              <p className={styles.help}>No hay grupos de variantes para seleccionar.</p>
            )}
            {variants.map((g) => (
              <div key={g.id} className={styles.fieldRow}>
                <label>{g.name}</label>
                <select
                  value={combinationAttrs[g.name] ?? ''}
                  onChange={e => setCombinationAttrs(a => ({ ...a, [g.name]: e.target.value }))}
                >
                  <option value="">--</option>
                  {g.values.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            ))}
            <div className={styles.fieldRow}>
              <label htmlFor="combination-sku">SKU</label>
              <input
                id="combination-sku"
                value={combinationSku}
                onChange={e => { setCombinationSku(e.target.value); runCombinationValidation(); }}
                onBlur={() => runCombinationValidation()}
                className={combinationErrors.sku ? styles.inputError : ''}
              />
            </div>
            {combinationErrors.sku && <div className={styles.errorText}>{combinationErrors.sku}</div>}
            <div className={styles.fieldRow}>
              <label htmlFor="combination-images">Imágenes</label>
              <div className={styles.imageUploaderContainer}>
                <ImageUploader onAddFiles={(f: File[]) => addFiles(f)} />
                <ImagePreviewList
                  items={uploadedFiles}
                  onRemove={(id: string) => removeFile(id)}
                  onRetry={(id: string) => retry(id)}
                  onSetPrimary={(id: string) => setPrimary(id)}
                />
              </div>
            </div>
            {combinationErrors.images && <div className={styles.errorText}>{combinationErrors.images}</div>}
            <div className={styles.fieldRow}>
              <label htmlFor="combination-price">Precio</label>
              <input
                id="combination-price"
                type="number"
                step="0.01"
                value={combinationPrice === '' ? '' : String(combinationPrice)}
                onChange={e => {
                  setCombinationPrice(e.target.value === '' ? '' : Number(e.target.value));
                  runCombinationValidation();
                }}
                onBlur={() => runCombinationValidation()}
                className={combinationErrors.price ? styles.inputError : ''}
              />
            </div>
            {combinationErrors.price && <div className={styles.errorText}>{combinationErrors.price}</div>}
            <div className={styles.fieldRow}>
              <label htmlFor="combination-stock">Stock</label>
              <input
                id="combination-stock"
                type="number"
                value={combinationStock === '' ? '' : String(combinationStock)}
                onChange={e => setCombinationStock(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setCombinationModalOpen(false)}>Cancelar</button>
              <button
                type="button"
                onClick={handleCreateCombination}
                disabled={!!(combinationErrors.sku || combinationErrors.images || combinationErrors.price)}
              >
                {editingSkuId ? 'Guardar cambios' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}