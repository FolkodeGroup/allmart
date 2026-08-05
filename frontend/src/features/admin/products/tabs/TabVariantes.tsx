import { forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react';
import type { TabVariantesProps } from '../components/types';
import type { AdminProduct } from '../../../../context/AdminProductsContext';
import { useAdminVariants } from '../../../../hooks/useAdminVariants';
import { validateCombination } from '../../../../utils/productFormUtils';
import type { CombinationValidationErrors } from '../../../../utils/productFormUtils';
import { getStoredToken } from '../../../../utils/apiClient';
import { ImageUploader, ImagePreviewList, useImageUpload } from '../../images';
import * as skuImagesService from '../../images/skuImagesService';
import { CombinationsTable } from '../../variants/components/CombinationTable';
import { ModalConfirm } from '../../../../components/ui/ModalConfirm/ModalConfirm';
import { Modal } from '../../../../components/ui/Modal';
import { Dropdown } from '../../../../components/ui/Dropdown/Dropdown';
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
    criticalStockThreshold?: number;
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
    setField,
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
        setCombinationErrors(result);
        return result;
    }, [combinationSku, combinationImages, combinationPrice, form.sku, uploadedFiles]);

    const openCombinationModal = () => {
        const initial: Record<string, string> = {};
        (form.variants ?? []).forEach((v: { name: string }) => {
            initial[v.name] = '';
        });
        setCombinationAttrs(initial);

        const hasExistingSkus = (skus && skus.length > 0) || (createdCombinations && createdCombinations.length > 0);
        const initialStock = (!hasExistingSkus && typeof form.stock === 'number' && form.stock > 0)
            ? form.stock
            : '';

        setCombinationStock(initialStock);
        setCombinationImages('');

        setCombinationPrice(form.price > 0 ? form.price : '');
        setCombinationCriticalThreshold('');
        setCombinationSku(form.sku ? `${form.sku}-` : '');
        setEditingSkuId(null);
        setCombinationErrors({});
        setSubmitComboAttempted(false);
        try {
            setFiles([] as UploadFileState[]);
        } catch {
            // ignore
        }
        setCombinationModalOpen(true);
    };

    const handleBulkGenerate = () => {
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

        const hasExistingSkus = (skus && skus.length > 0) || (createdCombinations && createdCombinations.length > 0);
        const baseStock = typeof form.stock === 'number' && form.stock > 0 ? form.stock : 0;

        for (let i = 0; i < allCombos.length; i++) {
            const combo = allCombos[i];
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

                const assignedStock = (!hasExistingSkus && i === 0 && baseStock > 0) ? baseStock : 0;

                newCombosToCreate.push({
                    sku,
                    attributes: attrs,
                    price: form.price > 0 ? form.price : undefined,
                    stock: assignedStock,
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
        setBulkConfirmOpen(false);

        if (!isEdit || !productId) {
            // Modo creación sin guardado intermedio: actualizamos el estado en memoria
            setCreatedCombinations(prev => {
                const next = [...combosToCreate, ...prev];
                setField('skus', next as Omit<AdminProduct, 'id'>['skus']);
                return next;
            });
            toast.success(`Se generaron ${combosToCreate.length} combinaciones en memoria para el nuevo producto`);
            setCombosToCreate([]);
            return;
        }

        // Modo edición: guardamos vía API
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

    const activeVariants = form.variants ?? [];
    const hasMissingAttrs = activeVariants.some((g: { name: string }) => !combinationAttrs[g.name] || !combinationAttrs[g.name].trim());
    const isComboFormInvalid =
        !combinationSku.trim() ||
        hasMissingAttrs ||
        !!(combinationErrors.sku || combinationErrors.images || combinationErrors.price) ||
        (combinationCriticalThreshold !== '' && (Number.isNaN(Number(combinationCriticalThreshold)) || Number(combinationCriticalThreshold) < 0));

    const handleCreateCombination = async () => {
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
            price,
            criticalStockThreshold: critical
        };

        if (!isEdit || !productId) {
            // Modo creación sin guardado intermedio
            setCreatedCombinations(prev => {
                const next = [optimisticCombo, ...prev];
                setField('skus', next as Omit<AdminProduct, 'id'>['skus']);
                return next;
            });
            setFiles([]);
            toast.success('Combinación añadida al nuevo producto');
            setIsSubmittingCombo(false);
            return;
        }

        // Modo edición existente con API
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

        } catch (_err) {
            console.error('Error al guardar variante:', _err);
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
        } catch (_err) {
            const status = _err && typeof _err === 'object' && 'status' in _err ? (_err as Record<string, unknown>).status : undefined;
            if (status === 403) {
                try {
                    const remainingRemote = uploadedFiles.filter(x => x.uid !== uid && x.remoteUrl).map(x => x.remoteUrl!);
                    await updateVariantChild(productId!, editingSkuId, { images: remainingRemote });
                    toast.success('Imagen eliminada');
                    await loadSkus(productId!);
                    return;
                } catch {
                    // fallthrough
                }
            }

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
        if (!isEdit || !productId) {
            setCreatedCombinations(prev => {
                const next = prev.filter((_, idx) => `local-${idx}` !== id && _.sku !== id);
                setField('skus', next as Omit<AdminProduct, 'id'>['skus']);
                return next;
            });
            toast.success('Combinación eliminada');
            return;
        }
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
                Agrupá opciones como Color o Tamaño. Gestioná todas tus variantes de forma limpia.
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
                            <button
                                type="button"
                                className={styles.deleteGroupBtn}
                                onClick={() => onRemoveVariantGroup(group.id)}
                                aria-label={`Eliminar grupo ${group.name}`}
                            >
                                ×
                            </button>
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
                                placeholder={`Añadir valor a ${group.name}...`}
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
                        className={styles.addCombinationBtn}
                        onClick={openCombinationModal}
                        disabled={(form.variants ?? []).length === 0}
                    >
                        + Agregar a mano
                    </button>
                    <button
                        type="button"
                        className={styles.bulkGenerateBtn}
                        onClick={handleBulkGenerate}
                        disabled={(form.variants ?? []).length === 0}
                    >
                        ⚡ Generar matriz de combinaciones
                    </button>
                </div>

                <CombinationsTable
                    skus={visibleSkus}
                    localCombinations={createdCombinations}
                    onEdit={handleEditCombination}
                    onDelete={handleDeleteCombination}
                />
            </div>

            {/* MODAL DE COMBINACIÓN */}
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

                    {/* SELECTORES DE ATRIBUTOS (FICHAS TÁCTILES O DROPDOWN) */}
                    {(form.variants ?? []).map((group: { id: string; name: string; values: string[] }) => {
                        const isAttrMissing = submitComboAttempted && (!combinationAttrs[group.name] || !combinationAttrs[group.name].trim());
                        const selectedVal = combinationAttrs[group.name] ?? '';
                        const useChips = group.values.length <= 6;

                        return (
                            <div key={group.id} className={styles.field}>
                                <label className={styles.label}>{group.name} *</label>

                                {useChips ? (
                                    <div className={styles.comboAttrChipsRow}>
                                        {group.values.map((value: string) => {
                                            const isSelected = selectedVal === value;
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    className={`${styles.comboAttrChip} ${isSelected ? styles.comboAttrChipSelected : ''}`}
                                                    onClick={() => setCombinationAttrs((prev: Record<string, string>) => ({ ...prev, [group.name]: value }))}
                                                >
                                                    {value}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <Dropdown
                                        options={group.values.map(v => ({ value: v, label: v }))}
                                        value={selectedVal}
                                        onChange={(val) => setCombinationAttrs((prev: Record<string, string>) => ({ ...prev, [group.name]: val }))}
                                        placeholder="-- Seleccionar --"
                                    />
                                )}

                                {isAttrMissing && (
                                    <span className={styles.errorText}>Tenés que seleccionar un valor para {group.name}.</span>
                                )}
                            </div>
                        );
                    })}

                    <div className={styles.comboModalRowFields}>
                        <div className={styles.field}>
                            <label htmlFor="modal-sku-tab-input" className={styles.label}>SKU *</label>
                            <input
                                id="modal-sku-tab-input"
                                className={`${styles.input} ${styles.comboModalInput} ${(submitComboAttempted && combinationErrors.sku) ? styles.inputError : ''}`}
                                value={combinationSku}
                                onChange={e => { setCombinationSku(e.target.value); if (submitComboAttempted) runCombinationValidation(); }}
                                onBlur={() => { if (submitComboAttempted) runCombinationValidation(); }}
                            />
                            {submitComboAttempted && combinationErrors.sku && <div className={styles.errorText}>{combinationErrors.sku}</div>}
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="modal-price-tab-input" className={styles.label}>Precio ($)</label>
                            <input
                                id="modal-price-tab-input"
                                type="number"
                                step="0.01"
                                className={`${styles.input} ${styles.comboModalInput} ${submitComboAttempted && combinationErrors.price ? styles.inputError : ''}`}
                                value={combinationPrice === '' ? '' : String(combinationPrice)}
                                onChange={e => {
                                    setCombinationPrice(e.target.value === '' ? '' : Number(e.target.value));
                                    if (submitComboAttempted) runCombinationValidation();
                                }}
                                onBlur={() => { if (submitComboAttempted) runCombinationValidation(); }}
                            />
                            {submitComboAttempted && combinationErrors.price && <div className={styles.errorText}>{combinationErrors.price}</div>}
                        </div>
                    </div>

                    <div className={styles.comboModalRowFields}>
                        <div className={styles.field}>
                            <label htmlFor="modal-stock-tab-input" className={styles.label}>Stock (unid.)</label>
                            <input
                                id="modal-stock-tab-input"
                                type="number"
                                className={`${styles.input} ${styles.comboModalInput}`}
                                value={combinationStock === '' ? '' : String(combinationStock)}
                                onChange={e => setCombinationStock(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="modal-threshold-tab-input" className={styles.label}>Umbral stock crítico</label>
                            <input
                                id="modal-threshold-tab-input"
                                type="number"
                                className={`${styles.input} ${styles.comboModalInput} ${submitComboAttempted && combinationCriticalThreshold !== '' && Number(combinationCriticalThreshold) < 0 ? styles.inputError : ''}`}
                                value={combinationCriticalThreshold === '' ? '' : String(combinationCriticalThreshold)}
                                onChange={e => setCombinationCriticalThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                            {submitComboAttempted && combinationCriticalThreshold !== '' && Number(combinationCriticalThreshold) < 0 && (
                                <div className={styles.errorText}>El umbral no puede ser negativo.</div>
                            )}
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="modal-images-uploader" className={styles.label}>Imágenes de la variante</label>
                        <div id="modal-images-uploader" style={{ marginTop: '4px', width: '100%', boxSizing: 'border-box' }}>
                            <ImageUploader onAddFiles={addFiles} onReject={(rej) => rej.forEach(r => toast.error(`${r.file.name}: ${r.reason}`))} />
                            <ImagePreviewList
                                items={uploadedFiles}
                                onRemove={handleRemoveUploadedFile}
                                onRetry={retry}
                                onSetPrimary={setPrimary}
                            />
                        </div>
                        {submitComboAttempted && combinationErrors.images && <div className={styles.errorText}>{combinationErrors.images}</div>}
                    </div>
                </div>
            </Modal>

            {/* Modal de Confirmación de Generación Masiva */}
            <ModalConfirm
                open={bulkConfirmOpen}
                title="Generar combinaciones"
                description={
                    !skus || skus.length === 0
                        ? `Se generarán ${combosToCreate.length} combinaciones. Se migrarán las ${form.stock ?? 0} unidades de stock del producto base a la primera variante.`
                        : `Se generarán ${combosToCreate.length} combinaciones nuevas. El precio se hereda del producto principal y el stock inicial será 0.`
                }
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