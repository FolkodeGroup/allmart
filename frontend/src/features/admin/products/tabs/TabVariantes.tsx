import { forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react';
import type { TabVariantesProps } from '../components/types';
import { useAdminVariants } from '../../../../hooks/useAdminVariants';
import { validateCombination } from '../../../../utils/productFormUtils';
import type { CombinationValidationErrors } from '../../../../utils/productFormUtils';
import { getStoredToken } from '../../../../utils/apiClient';
import { ImageUploader, ImagePreviewList, useImageUpload } from '../../images';
import * as skuImagesService from '../../images/skuImagesService';
import { CombinationsTable } from '../../variants/components/CombinationTable';
import { ModalConfirm } from '../../../../components/ui/ModalConfirm/ModalConfirm';
import { Modal } from '../../../../components/ui/Modal';
import type { UploadFileState } from '../../images';
import styles from './TabVariantes.module.css';
import toast from 'react-hot-toast';

export type TabVariantesRef = {
    validate: () => Record<string, string>;
};

type CreatedCombination = {
    id?: string;
    sku?: string;
    attributes: Record<string, string>;
    stock?: number;
    price?: number;
    images?: string[];
};

export const TabVariantes = forwardRef<TabVariantesRef, TabVariantesProps>(function TabVariantes({
    form,
    productId,
    isEdit,
    newGroupName,
    setNewGroupName,
    newGroupValues,
    setNewGroupValues,
    onAddVariantGroup,
    onRemoveVariantGroup,
    onAddVariantValue,
    onRemoveVariantValue,
    errors = {},
}, ref) {
    const [localErrors, setLocalErrors] = useState<Record<string, string>>(errors);

    const [isSubmittingCombo, setIsSubmittingCombo] = useState(false);

    interface Sku {
        id: string;
        sku?: string;
        attributes?: Record<string, string>;
        stock?: number;
        price?: number;
        images?: string[];
    }

    const {
        skus,
        loadSkus,
        createVariantChild,
        updateVariantChild,
        deleteVariantChild,
    } = useAdminVariants();

    const token = getStoredToken() ?? '';
    const {
        files: uploadedFiles,
        addFiles,
        remove: removeFile,
        setPrimary,
        uploadAll,
        retry,
        setFiles,
    } = useImageUpload({ token, productId: productId ?? '' });

    const [combinationModalOpen, setCombinationModalOpen] = useState(false);
    const [combinationSku, setCombinationSku] = useState('');
    const [combinationStock, setCombinationStock] = useState<number | ''>('');
    const [combinationImages, setCombinationImages] = useState('');
    const [combinationPrice, setCombinationPrice] = useState<number | ''>('');
    const [combinationCriticalThreshold, setCombinationCriticalThreshold] = useState<number | ''>('');
    const [combinationAttrs, setCombinationAttrs] = useState<Record<string, string>>({});
    const [combinationErrors, setCombinationErrors] = useState<CombinationValidationErrors>({});

    // 🟢 NUEVO: Estado para rastrear el intento de envío del modal
    const [submitComboAttempted, setSubmitComboAttempted] = useState(false);

    const [createdCombinations, setCreatedCombinations] = useState<CreatedCombination[]>([]);
    const [editingSkuId, setEditingSkuId] = useState<string | null>(null);

    const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
    const [combosToCreate, setCombosToCreate] = useState<CreatedCombination[]>([]);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [skuToDeleteId, setSkuToDeleteId] = useState<string | null>(null);
    const [deletedSkuIds, setDeletedSkuIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!productId) return;
        loadSkus(productId);
    }, [productId, loadSkus]);

    useEffect(() => {
        if (!skus || skus.length === 0) return;
        setCreatedCombinations(prev => prev.filter(local => {
            if (!local.sku) return true;
            return !skus.some((s: Sku) => (local.id && s.id === local.id) || (local.sku && s.sku === local.sku));
        }));
    }, [skus]);

    useEffect(() => {
        if (combinationModalOpen && !editingSkuId && form.sku) {
            const attrValues = Object.values(combinationAttrs).filter(Boolean);
            if (attrValues.length > 0) {
                const suffix = attrValues.map(v => v.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()).join('-');
                const generatedSku = `${form.sku}-${suffix}`;
                setCombinationSku(generatedSku);

                if (generatedSku && !/[^A-Z0-9-]/.test(generatedSku)) {
                    setCombinationErrors(prev => {
                        const next = { ...prev };
                        delete next.sku;
                        return next;
                    });
                }
            } else {
                setCombinationSku(`${form.sku}-`);
            }
        }
    }, [combinationAttrs, combinationModalOpen, editingSkuId, form.sku]);

    const runCombinationValidation = useCallback(() => {
        let imagesInput: unknown = combinationImages;
        if (!combinationImages.trim()) {
            if (uploadedFiles && uploadedFiles.length > 0) {
                imagesInput = uploadedFiles.map(f => f.remoteUrl ?? f.previewUrl ?? f.uid);
            } else {
                imagesInput = '';
            }
        }

        const result = validateCombination({
            sku: combinationSku,
            skuBase: form.sku,
            images: imagesInput,
            price: combinationPrice,
        });
        // local threshold validation is checked in the component
        setCombinationErrors(result);
        return result;
    }, [combinationSku, combinationImages, combinationPrice, form.sku, uploadedFiles]);

    const openCombinationModal = () => {
        const initial: Record<string, string> = {};
        (form.variants ?? []).forEach((v: { name: string }) => {
            initial[v.name] = '';
        });
        setCombinationAttrs(initial);
        setCombinationStock('');
        setCombinationImages('');

        setCombinationPrice(form.price > 0 ? form.price : '');
        setCombinationCriticalThreshold('');
        setCombinationSku(form.sku ? `${form.sku}-` : '');
        setEditingSkuId(null);
        setCombinationErrors({});
        setSubmitComboAttempted(false); // 🟢 Reset del intento de submit
        try {
            setFiles([] as UploadFileState[]);
        } catch {
            // ignore
        }
        setCombinationModalOpen(true);
    };

    const handleBulkGenerate = () => {
        if (!productId) return;
        if (!form.variants || form.variants.length === 0) {
            toast.error('Agregá al menos un grupo de variantes con valores.');
            return;
        }

        const variantNames = form.variants.map((g: { name: string }) => g.name);
        const variantValuesLists = form.variants.map((g: { values: string[] }) => g.values);

        if (variantValuesLists.some((list: string[]) => list.length === 0)) {
            toast.error('Todos los grupos de variantes deben tener al menos un valor cargado para generar combinaciones.');
            return;
        }

        const cartesian = (arrays: string[][]): string[][] => {
            return arrays.reduce<string[][]>((a, b) =>
                a.flatMap(d => b.map(e => [...d, e])),
                [[]]
            );
        };

        const allCombos = cartesian(variantValuesLists);
        const newCombosToCreate: CreatedCombination[] = [];

        for (const combo of allCombos) {
            const attrs: Record<string, string> = {};
            combo.forEach((val, idx) => {
                attrs[variantNames[idx]] = val;
            });

            const exists = skus.some((s: Sku) => {
                const sAttrs = s.attributes || {};
                const keys1 = Object.keys(attrs);
                const keys2 = Object.keys(sAttrs);
                if (keys1.length !== keys2.length) return false;
                return keys1.every(k => sAttrs[k] === attrs[k]);
            });

            if (!exists) {
                const suffix = combo.map(v => v.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()).join('-');
                const sku = form.sku ? `${form.sku}-${suffix}` : suffix;

                newCombosToCreate.push({
                    sku,
                    attributes: attrs,
                    price: form.price > 0 ? form.price : undefined,
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
        if (!productId) return;
        setBulkConfirmOpen(false);

        setCreatedCombinations(prev => [...combosToCreate, ...prev]);
        const loadingToast = toast.loading(`Generando ${combosToCreate.length} combinaciones...`);

        try {
            for (const combo of combosToCreate) {
                await createVariantChild(productId, {
                    sku: combo.sku,
                    attributes: combo.attributes,
                    price: combo.price,
                    stock: combo.stock
                });
            }
            await loadSkus(productId);
            toast.success('Generación exitosa', { id: loadingToast });
        } catch (err) {
            console.error('Error creando la combinación', err);
            toast.error('Ocurrió un error al generar combinaciones', { id: loadingToast });
        } finally {
            setCombosToCreate([]);
        }
    };

    // 🟢 VALIDACIÓN DE ESTADO REACTIVO PARA EL BOTÓN "CREAR"
    const activeVariants = form.variants ?? [];
    const hasMissingAttrs = activeVariants.some((g: { name: string }) => !combinationAttrs[g.name] || !combinationAttrs[g.name].trim());
    const isComboFormInvalid =
        !combinationSku.trim() ||
        hasMissingAttrs ||
        !!(combinationErrors.sku || combinationErrors.images || combinationErrors.price) ||
        (combinationCriticalThreshold !== '' && (Number.isNaN(Number(combinationCriticalThreshold)) || Number(combinationCriticalThreshold) < 0));

    const handleCreateCombination = async () => {
        if (!productId) return;

        setSubmitComboAttempted(true);

        const validation = runCombinationValidation();
        if (isComboFormInvalid || (validation && (validation.sku || validation.images || validation.price))) {
            toast.error('Completá todos los campos obligatorios.');
            return;
        }

        setIsSubmittingCombo(true);

        const attrs = { ...combinationAttrs };
        const sku = combinationSku.trim();
        const stock = combinationStock === '' ? undefined : Number(combinationStock);
        let images: string[] | undefined;

        const raw = combinationImages.trim();
        if (raw) {
            if (raw.includes('\n')) images = raw.split('\n').map(s => s.trim()).filter(Boolean);
            else images = [raw];
        }

        const price = combinationPrice === '' ? undefined : Number(combinationPrice);
        const critical = combinationCriticalThreshold === '' ? undefined : Number(combinationCriticalThreshold);

        setCombinationModalOpen(false);
        setEditingSkuId(null);
        setCombinationAttrs({});
        setCombinationSku('');
        setCombinationPrice('');
        setCombinationStock('');
        setCombinationImages('');
        setSubmitComboAttempted(false);

        const optimisticCombo: CreatedCombination = {
            sku: sku || undefined,
            attributes: attrs,
            stock,
            images: uploadedFiles.map(f => f.remoteUrl || f.previewUrl).filter(Boolean) as string[],
            price
        };
        setCreatedCombinations(prev => [optimisticCombo, ...prev]);

        try {
            let persistedSkuId = editingSkuId;

            if (!persistedSkuId) {
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
                await updateVariantChild(productId, persistedSkuId, { images, price, stock, sku: sku || undefined, attributes: attrs, criticalStockThreshold: critical });
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

    const handleRemoveUploadedFile = async (uid: string) => {
        const file = uploadedFiles.find(f => f.uid === uid);
        if (!file) return;
        if (file.file || file.status !== 'success' || !file.remoteUrl) {
            removeFile(uid);
            return;
        }
        if (!editingSkuId) {
            removeFile(uid);
            toast.success('Imagen eliminada del preview');
            return;
        }
        const copy = file;
        setFiles(prev => prev.filter(x => x.uid !== uid));
        try {
            if (file.id) {
                await skuImagesService.deleteSkuImage(token, String(productId), editingSkuId, file.id);
            } else {
                const remainingRemote = uploadedFiles.filter(x => x.uid !== uid && x.remoteUrl).map(x => x.remoteUrl!);
                await updateVariantChild(productId!, editingSkuId, { images: remainingRemote });
            }
            toast.success('Imagen eliminada');
            await loadSkus(productId!);
        } catch (err) {
            setFiles(prev => [copy, ...prev]);
            toast.error('No se pudo eliminar la imagen en el servidor');
        }
    };

    const handleEditCombination = (id: string) => {
        const sku = skus.find((s: Sku) => s.id === id);
        if (!sku) return;
        setCombinationAttrs(sku.attributes || {});
        setCombinationSku(sku.sku ?? '');
        setCombinationStock(typeof sku.stock === 'number' ? sku.stock : '');
        setCombinationPrice(typeof sku.price === 'number' ? sku.price : '');
        setCombinationImages(Array.isArray(sku.images) ? sku.images.join('\n') : '');
        setEditingSkuId(id);
        setSubmitComboAttempted(false);
        if (Array.isArray(sku.images) && sku.images.length > 0) {
            const initial: UploadFileState[] = sku.images.map((url: string) => {
                const str = String(url);
                const m = str.match(/\/api\/images\/sku\/([A-Za-z0-9-_.]+)/);
                const id = m ? m[1] : undefined;
                return ({
                    uid: `remote-${Math.random().toString(36).slice(2, 8)}`,
                    previewUrl: url,
                    remoteUrl: url,
                    status: 'success',
                    id,
                } as UploadFileState);
            });
            setFiles(initial);
        } else {
            setFiles([] as UploadFileState[]);
        }
        setCombinationModalOpen(true);
    };

    const handleDeleteCombination = (id: string) => {
        if (!productId) return;
        setSkuToDeleteId(id);
        setDeleteConfirmOpen(true);
    };

    const executeDeleteCombination = async () => {
        if (!productId || !skuToDeleteId) return;
        setDeleteConfirmOpen(false);

        setDeletedSkuIds(prev => new Set([...prev, skuToDeleteId]));

        try {
            await deleteVariantChild(productId, skuToDeleteId);
            toast.success('Combinación eliminada');
        } catch {
            setDeletedSkuIds(prev => {
                const next = new Set(prev);
                next.delete(skuToDeleteId);
                return next;
            });
            toast.error('Error al eliminar combinación');
        } finally {
            setSkuToDeleteId(null);
        }
    };

    useImperativeHandle(ref, () => ({
        validate: () => {
            const errs: Record<string, string> = {};
            if (!form.variants || form.variants.length === 0) errs.variants = 'Agrega al menos un grupo de variantes';
            setLocalErrors(errs);
            return errs;
        }
    }), [form]);

    const visibleSkus = (skus || []).filter((s: Sku) => !deletedSkuIds.has(s.id));

    return (
        <fieldset className={styles.fieldset}>
            <p className={styles.fieldHint}>
                Agrupá opciones como Color o Tamaño. Gestioná todas tus variantes desde la pestaña de
                Variantes en esta vista.
            </p>

            <div className={styles.newGroupRow}>
                <input
                    className={styles.input}
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAddVariantGroup())}
                    placeholder="Nombre del grupo, ej: Color, Tamaño..."
                />
                <button
                    type="button"
                    className={styles.addBtn}
                    onClick={onAddVariantGroup}
                    aria-label="Agregar grupo de variantes"
                >
                    <span className={styles.btnIcon}>+</span> Grupo
                </button>
            </div>
            {localErrors.variants && <span className={styles.errorText}>{localErrors.variants}</span>}

            <div className={styles.attributesList}>
                {(form.variants ?? []).map((group: { id: string; name: string; values: string[] }) => (
                    <div key={group.id} className={styles.variantRow}>
                        <div className={styles.variantLabelBlock}>
                            <span className={styles.variantGroupName}>
                                {group.name}
                            </span>
                        </div>

                        <div className={styles.tagsContainer}>
                            {group.values.map((val: string) => (
                                <span key={val} className={styles.tagChip}>
                                    {val}
                                    <button
                                        type="button"
                                        className={styles.tagRemoveBtn}
                                        onClick={() => onRemoveVariantValue(group.id, val)}
                                        aria-label={`Eliminar variante ${val}`}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className={styles.addValueInputBlock}>
                            <input
                                className={styles.compactInput}
                                value={newGroupValues[group.id] ?? ''}
                                onChange={e =>
                                    setNewGroupValues(prev => ({ ...prev, [group.id]: e.target.value }))
                                }
                                onKeyDown={e =>
                                    e.key === 'Enter' && (e.preventDefault(), onAddVariantValue(group.id))
                                }
                                placeholder={`Añadir...`}
                            />
                            <button
                                type="button"
                                className={styles.compactAddBtn}
                                onClick={() => onAddVariantValue(group.id)}
                                aria-label={`Agregar valor a ${group.name}`}
                            >
                                +
                            </button>
                        </div>

                        <button
                            type="button"
                            className={styles.deleteGroupBtn}
                            onClick={() => onRemoveVariantGroup(group.id)}
                            aria-label={`Eliminar grupo ${group.name}`}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            {(form.variants ?? []).length === 0 && (
                <p className={styles.emptyPlaceholder}>
                    Todavía no hay grupos de variantes creados. Creá el primero arriba.
                </p>
            )}

            <div className={styles.combinationsSection}>
                <div className={styles.combinationsToolbar}>
                    <button
                        type="button"
                        className={styles.bulkGenerateBtn}
                        onClick={handleBulkGenerate}
                        disabled={!isEdit || !productId || (form.variants ?? []).length === 0}
                    >
                        ⚡ Generar matriz de combinaciones
                    </button>
                    <button
                        type="button"
                        className={styles.addCombinationBtn}
                        onClick={openCombinationModal}
                        disabled={!isEdit || !productId}
                    >
                        + Agregar a mano
                    </button>
                </div>

                {(!isEdit || !productId) && (
                    <p className={styles.fieldHint} style={{ marginTop: '4px', fontStyle: 'italic' }}>
                        Guarda el producto primero para poder crear combinaciones.
                    </p>
                )}

                <CombinationsTable
                    skus={visibleSkus}
                    localCombinations={createdCombinations}
                    onEdit={handleEditCombination}
                    onDelete={handleDeleteCombination}
                />
            </div>

            {/* 🟢 MODAL DE COMBINACIÓN BLINDADO CON VALIDACIONES EXPLICITAS */}
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
                            disabled={isSubmittingCombo || isComboFormInvalid}
                        >
                            {isSubmittingCombo ? 'Guardando...' : (editingSkuId ? 'Guardar cambios' : 'Crear')}
                        </button>
                    </>
                }
            >
                <div className={styles.modalFieldsContainer}>
                    {(!form.variants || form.variants.length === 0) && (
                        <p className={styles.fieldHint}>No hay grupos de variantes para seleccionar.</p>
                    )}

                    {/* 🟢 VALIDACIÓN DE SELECTS DE ATRIBUTOS */}
                    {(form.variants ?? []).map((group: { id: string; name: string; values: string[] }) => {
                        const isAttrMissing = submitComboAttempted && (!combinationAttrs[group.name] || !combinationAttrs[group.name].trim());
                        return (
                            <div key={group.id} className={styles.field}>
                                <label className={styles.label}>{group.name} *</label>
                                <select
                                    className={`${styles.input} ${isAttrMissing ? styles.inputError : ''}`}
                                    value={combinationAttrs[group.name] ?? ''}
                                    onChange={e => setCombinationAttrs((prev: Record<string, string>) => ({ ...prev, [group.name]: e.target.value }))}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {group.values.map((value: string) => (
                                        <option key={value} value={value}>{value}</option>
                                    ))}
                                </select>
                                {isAttrMissing && (
                                    <span className={styles.errorText}>Tenés que seleccionar un valor para {group.name}.</span>
                                )}
                            </div>
                        );
                    })}

                    {/* 🟢 VALIDACIÓN DE SKU */}
                    <div className={styles.field}>
                        <label htmlFor="combination-sku" className={styles.label}>SKU *</label>
                        <input
                            id="combination-sku"
                            className={`${styles.input} ${(combinationErrors.sku || (submitComboAttempted && !combinationSku.trim())) ? styles.inputError : ''}`}
                            value={combinationSku}
                            onChange={e => { setCombinationSku(e.target.value); runCombinationValidation(); }}
                            onBlur={() => runCombinationValidation()}
                        />
                        {combinationErrors.sku && <div className={styles.errorText}>{combinationErrors.sku}</div>}
                        {!combinationErrors.sku && submitComboAttempted && !combinationSku.trim() && (
                            <div className={styles.errorText}>El campo SKU es obligatorio.</div>
                        )}
                    </div>

                    {/* Imágenes */}
                    <div className={styles.field}>
                        <label htmlFor="combination-images" className={styles.label}>Imágenes</label>
                        <div style={{ marginTop: '8px' }}>
                            <ImageUploader onAddFiles={addFiles} onReject={(rej) => rej.forEach(r => toast.error(`${r.file.name}: ${r.reason}`))} />
                            <ImagePreviewList
                                items={uploadedFiles}
                                onRemove={handleRemoveUploadedFile}
                                onRetry={retry}
                                onSetPrimary={setPrimary}
                            />
                        </div>
                        {combinationErrors.images && <div className={styles.errorText}>{combinationErrors.images}</div>}
                    </div>

                    {/* Precio & Stock */}
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
                    <div className={styles.field}>
                        <label htmlFor="combination-critical" className={styles.label}>Umbral stock crítico</label>
                        <input
                            id="combination-critical"
                            type="number"
                            className={`${styles.input} ${combinationCriticalThreshold !== '' && Number(combinationCriticalThreshold) < 0 ? styles.inputError : ''}`}
                            value={combinationCriticalThreshold === '' ? '' : String(combinationCriticalThreshold)}
                            onChange={e => setCombinationCriticalThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                        {combinationCriticalThreshold !== '' && Number(combinationCriticalThreshold) < 0 && (
                            <div className={styles.errorText}>El umbral no puede ser negativo.</div>
                        )}
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
        </fieldset>
    );
});