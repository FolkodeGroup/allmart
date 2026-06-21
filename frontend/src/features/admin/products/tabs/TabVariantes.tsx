import { forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react';
import type { TabVariantesProps } from '../components/types';
import { useAdminVariants } from '../../../../context/AdminVariantsContext';
import { validateCombination } from '../../../../utils/productFormUtils';
import type { CombinationValidationErrors } from '../../../../utils/productFormUtils';
import { getStoredToken } from '../../../../utils/apiClient';
import { ImageUploader, ImagePreviewList, useImageUpload } from '../../images';
import { CombinationsTable } from '../../variants/components/CombinationTable';
import { ModalConfirm } from '../../../../components/ui/ModalConfirm/ModalConfirm';
import type { UploadFileState } from '../../images';
import styles from '../AdminProductFormPage.module.css';

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
    const [combinationAttrs, setCombinationAttrs] = useState<Record<string, string>>({});
    const [combinationErrors, setCombinationErrors] = useState<CombinationValidationErrors>({});
    const [createdCombinations, setCreatedCombinations] = useState<CreatedCombination[]>([]);
    const [editingSkuId, setEditingSkuId] = useState<string | null>(null);

    // Estados para el Modal de Confirmación de Generación Masiva
    const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
    const [combosToCreate, setCombosToCreate] = useState<CreatedCombination[]>([]);

    // Estados para el Modal de Confirmación de Eliminación Individual Customizado
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [skuToDeleteId, setSkuToDeleteId] = useState<string | null>(null);

    // Estado optimista para eliminación inmediata (0ms percibidos en UI)
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

    // ─── 1. SKU Automático Reactivo ─────────────────────────────────────────────
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
        (form.variants ?? []).forEach(v => {
            initial[v.name] = '';
        });
        setCombinationAttrs(initial);
        setCombinationStock('');
        setCombinationImages('');
        
        setCombinationPrice(form.price > 0 ? form.price : '');
        setCombinationSku(form.sku ? `${form.sku}-` : '');
        setEditingSkuId(null);
        setCombinationErrors({});
        try {
            setFiles([] as UploadFileState[]);
        } catch {
            // ignore if hook is unavailable
        }
        setCombinationModalOpen(true);
    };

    // ─── 3. Preparar la Generación en Matriz (Abre el Modal) ─────────────────
    const handleBulkGenerate = () => {
        if (!productId) return;
        if (!form.variants || form.variants.length === 0) {
            alert('Agregá al menos un grupo de variantes con valores.');
            return;
        }

        const variantNames = form.variants.map(g => g.name);
        const variantValuesLists = form.variants.map(g => g.values);

        if (variantValuesLists.some(list => list.length === 0)) {
            alert('Todos los grupos de variantes deben tener al menos un valor cargado para generar combinaciones.');
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
            alert('Todas las combinaciones posibles ya fueron generadas.');
            return;
        }

        setCombosToCreate(newCombosToCreate);
        setBulkConfirmOpen(true);
    };

    // ─── 4. Ejecutar la Generación en Matriz (Desde el Modal) ────────────────
    const executeBulkGenerate = async () => {
        if (!productId) return;
        setBulkConfirmOpen(false);

        setCreatedCombinations(prev => [...combosToCreate, ...prev]);

        for (const combo of combosToCreate) {
            try {
                await createVariantChild(productId, {
                    sku: combo.sku,
                    attributes: combo.attributes,
                    price: combo.price,
                    stock: combo.stock
                });
            } catch (err) {
                console.error('Error creando la combinación', combo, err);
            }
        }
        await loadSkus(productId);
        setCombosToCreate([]);
    };

    const handleCreateCombination = async () => {
        if (!productId) return;
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

        const validation = runCombinationValidation();
        if (validation && (validation.sku || validation.images || validation.price)) {
            return;
        }

        let persistedSkuId: string | undefined;
        if (editingSkuId) {
            await updateVariantChild(productId, editingSkuId, { sku: sku || undefined, attributes: attrs, stock, price });
            persistedSkuId = editingSkuId;
        } else {
            const created = await createVariantChild(productId, { sku: sku || undefined, attributes: attrs, stock, price });
            if (created && typeof created === 'object' && (created as Record<string, unknown>).id) {
                persistedSkuId = String((created as Record<string, unknown>).id);
            }
        }

        let uploadedRemoteUrls: string[] = [];
        if (persistedSkuId) {
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

        try {
            if (persistedSkuId) {
                await updateVariantChild(productId, persistedSkuId, { images, price, attributes: attrs });
            } else if (!editingSkuId) {
                const newItem: CreatedCombination = { sku: sku || undefined, attributes: attrs, stock, images, price };
                setCreatedCombinations(prev => [newItem, ...prev]);
            } else {
                if (editingSkuId) await updateVariantChild(productId, editingSkuId, { images, price, attributes: attrs });
            }
        } finally {
            setCombinationModalOpen(false);
            setEditingSkuId(null);
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
        if (Array.isArray(sku.images) && sku.images.length > 0) {
            const initial: UploadFileState[] = sku.images.map((url: string) => ({
                uid: `remote-${Math.random().toString(36).slice(2, 8)}`,
                previewUrl: url,
                remoteUrl: url,
                status: 'success',
            } as UploadFileState));
            setFiles(initial);
        } else {
            setFiles([] as UploadFileState[]);
        }
        setCombinationModalOpen(true);
    };

    // ─── 5. Eliminación vinculada a ModalConfirm Custom con Optimistic UI ─────
    const handleDeleteCombination = (id: string) => {
        if (!productId) return;
        setSkuToDeleteId(id);
        setDeleteConfirmOpen(true);
    };

    const executeDeleteCombination = async () => {
        if (!productId || !skuToDeleteId) return;
        setDeleteConfirmOpen(false);

        // Optimistic UI Update: Ocultar de inmediato
        setDeletedSkuIds(prev => new Set([...prev, skuToDeleteId]));

        try {
            await deleteVariantChild(productId, skuToDeleteId);
        } catch (err) {
            console.error('Error al eliminar la combinación:', err);
            // Revertir estado si falla
            setDeletedSkuIds(prev => {
                const next = new Set(prev);
                next.delete(skuToDeleteId);
                return next;
            });
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

    // Filtrar localmente las SKUs que se eliminaron optimistamente
    const visibleSkus = (skus || []).filter((s: Sku) => !deletedSkuIds.has(s.id));

    return (
        <fieldset className={styles.fieldset}>
            <p className={styles.fieldHint}>
                Agrupá opciones como Color o Tamaño. Gestiona todas tus variantes desde la pestaña de
                Variantes en esta vista.
            </p>

            <div className={styles.tagRow}>
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
                    <i className="bi bi-plus-lg" style={{ marginRight: '4px' }}></i> Grupo
                </button>
            </div>
            {localErrors.variants && <span className={styles.errorText}>{localErrors.variants}</span>}

            {(form.variants ?? []).map(group => (
                <div key={group.id} className={styles.variantGroup}>
                    <div className={styles.variantGroupHeader}>
                        <span className={styles.variantGroupName}>
                            <i className="bi bi-layers-half" style={{ marginRight: '8px', color: 'var(--color-primary)' }}></i>
                            {group.name}
                        </span>
                        <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => onRemoveVariantGroup(group.id)}
                            aria-label={`Eliminar grupo ${group.name}`}
                        >
                            <i className="bi bi-trash" style={{ color: 'var(--color-error)' }}></i>
                        </button>
                    </div>

                    <div className={styles.tags}>
                        {group.values.map(val => (
                            <span key={val} className={styles.tag}>
                                {val}
                                <button
                                    type="button"
                                    className={styles.tagRemove}
                                    onClick={() => onRemoveVariantValue(group.id, val)}
                                    aria-label={`Eliminar variante ${val}`}
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            </span>
                        ))}
                    </div>

                    <div className={styles.tagRow}>
                        <input
                            className={styles.input}
                            value={newGroupValues[group.id] ?? ''}
                            onChange={e =>
                                setNewGroupValues(prev => ({ ...prev, [group.id]: e.target.value }))
                            }
                            onKeyDown={e =>
                                e.key === 'Enter' && (e.preventDefault(), onAddVariantValue(group.id))
                            }
                            placeholder={`Agregar valor a ${group.name}...`}
                        />
                        <button
                            type="button"
                            className={styles.addBtn}
                            onClick={() => onAddVariantValue(group.id)}
                            aria-label={`Agregar valor a ${group.name}`}
                        >
                            <i className="bi bi-plus"></i>
                        </button>
                    </div>
                </div>
            ))}

            {(form.variants ?? []).length === 0 && (
                <p className={styles.fieldHint} style={{ marginTop: '8px', fontStyle: 'italic' }}>
                    Todavía no hay grupos de variantes. Creá uno arriba.
                </p>
            )}

            <div className={styles.combinationsSection}>
                <div className={styles.combinationsToolbar} style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className={styles.addCombinationBtn}
                        onClick={handleBulkGenerate}
                        disabled={!isEdit || !productId || (form.variants ?? []).length === 0}
                        style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', boxShadow: 'none' }}
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
                    <p className={styles.fieldHint} style={{ marginTop: '4px' }}>
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

            {/* Modal Manual de Agregar/Editar Combinación */}
            {combinationModalOpen && (
                <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
                    <div className={styles.modal}>
                        <h3>{editingSkuId ? 'Editar combinación' : 'Agregar combinación'}</h3>
                        {(!form.variants || form.variants.length === 0) && (
                            <p className={styles.help}>No hay grupos de variantes para seleccionar.</p>
                        )}
                        {(form.variants ?? []).map((group) => (
                            <div key={group.id} className={styles.fieldRow}>
                                <label>{group.name}</label>
                                <select
                                    value={combinationAttrs[group.name] ?? ''}
                                    onChange={e => setCombinationAttrs(prev => ({ ...prev, [group.name]: e.target.value }))}
                                >
                                    <option value="">--</option>
                                    {group.values.map(value => (
                                        <option key={value} value={value}>{value}</option>
                                    ))}
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
                                <ImageUploader onAddFiles={addFiles} />
                                <ImagePreviewList
                                    items={uploadedFiles}
                                    onRemove={removeFile}
                                    onRetry={retry}
                                    onSetPrimary={setPrimary}
                                />
                            </div>
                        </div>
                        {combinationErrors.images && <div className={styles.errorText}>{combinationErrors.images}</div>}
                        <div className={styles.fieldRow}>
                            <label htmlFor="combination-sku-price">Precio</label>
                            <input
                                id="combination-sku-price"
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