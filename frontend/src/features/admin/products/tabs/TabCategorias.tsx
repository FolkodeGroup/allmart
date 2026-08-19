import React, { memo, useMemo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { TabFormState, SetField } from '../components/types';
import type { Category } from '../../../../types';
import styles from '../AdminProductFormPage.module.css';
import { Dropdown } from '../../../../components/ui/Dropdown/Dropdown';
import { Layers, Search, X, Check, Plus, AlertCircle } from 'lucide-react';

interface TabCategoriasProps extends TabFormState {
    setField: SetField;
    categories: Category[];
    additionalCategoryIds: string[];
    onPrimaryCategoryChange: (value: string) => void;
    onAdditionalCategoriesChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    getCategoryLabel: (category: { id: string; name: string; parentId?: string | null }) => string;
}

export const TabCategorias = memo(function TabCategorias({
    form,
    fieldErrors,
    categories,
    additionalCategoryIds,
    onPrimaryCategoryChange,
    onAdditionalCategoriesChange,
    getCategoryLabel,
}: TabCategoriasProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(additionalCategoryIds);

    const hasPrimaryCategory = Boolean(form.category?.id);
    const primaryCategoryId = form.category?.id;

    // Sincronizar selección temporal cuando cambian las props o se abre el modal
    useEffect(() => {
        setTempSelectedIds(additionalCategoryIds);
    }, [additionalCategoryIds, modalOpen]);

    const openSubcategoryPicker = useCallback(() => {
        if (!hasPrimaryCategory) return;
        setModalOpen(true);
    }, [hasPrimaryCategory]);

    // 🛡️ REGLA ARQUITECTÓNICA: Solo categorías raíz son elegibles como Categoría Principal
    const primaryCategoryOptions = useMemo(() => {
        const rootCategories = categories.filter(c => !c.parentId);
        return rootCategories.map(c => ({
            value: c.id,
            label: getCategoryLabel(c),
        }));
    }, [categories, getCategoryLabel]);

    // 🛡️ REGLA ARQUITECTÓNICA: Filtrado estricto - Solo subcategorías del padre seleccionado
    const availableSubcategories = useMemo(() => {
        if (!primaryCategoryId) return [];
        return categories.filter(c => c.parentId === primaryCategoryId);
    }, [categories, primaryCategoryId]);

    // Subcategorías filtradas por término de búsqueda en tiempo real
    const filteredSubcategories = useMemo(() => {
        if (!searchTerm.trim()) return availableSubcategories;
        const q = searchTerm.toLowerCase().trim();
        return availableSubcategories.filter(c => {
            const nameMatch = c.name.toLowerCase().includes(q);
            const slugMatch = c.slug.toLowerCase().includes(q);
            return nameMatch || slugMatch;
        });
    }, [availableSubcategories, searchTerm]);

    // Simulación de evento para actualizar la selección en el formulario principal
    const updateAdditionalCategories = useCallback((nextIds: string[]) => {
        onAdditionalCategoriesChange({
            target: {
                selectedOptions: nextIds.map(id => ({ value: id }))
            }
        } as unknown as React.ChangeEvent<HTMLSelectElement>);
    }, [onAdditionalCategoriesChange]);

    const handleToggleTempSubcategory = useCallback((subcategoryId: string) => {
        setTempSelectedIds(prev =>
            prev.includes(subcategoryId)
                ? prev.filter(id => id !== subcategoryId)
                : [...prev, subcategoryId]
        );
    }, []);

    const handleApplySelection = useCallback(() => {
        updateAdditionalCategories(tempSelectedIds);
        setModalOpen(false);
        setSearchTerm('');
    }, [tempSelectedIds, updateAdditionalCategories]);

    const handleRemoveChip = useCallback((subcategoryId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const nextIds = additionalCategoryIds.filter(id => id !== subcategoryId);
        updateAdditionalCategories(nextIds);
    }, [additionalCategoryIds, updateAdditionalCategories]);

    // Subcategorías actualmente seleccionadas para renderizar los chips
    const selectedSubcategoryObjects = useMemo(() => {
        return additionalCategoryIds
            .map(id => categories.find(c => c.id === id))
            .filter((c): c is Category => Boolean(c));
    }, [additionalCategoryIds, categories]);

    // Render del Modal / Bottom Sheet portaleado
    const renderModal = () => {
        if (!modalOpen) return null;

        const modalContent = (
            <div className="subcatPickerOverlay" role="presentation">
                <button
                    type="button"
                    className="subcatPickerBackdrop"
                    onClick={() => setModalOpen(false)}
                    aria-label="Cerrar modal"
                    tabIndex={-1}
                />
                <div
                    className="subcatPickerSheet"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="subcat-picker-title"
                >
                    {/* Encabezado */}
                    <div className="subcatPickerHeader">
                        <div>
                            <h3 id="subcat-picker-title" className="subcatPickerTitle">
                                Subcategorías de {form.category?.name || 'Categoría'}
                            </h3>
                            <p className="subcatPickerSubtitle">
                                Seleccioná las subcategorías asociadas para este producto
                            </p>
                        </div>
                        <button
                            type="button"
                            className="subcatPickerCloseBtn"
                            onClick={() => setModalOpen(false)}
                            aria-label="Cerrar"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Buscador Integrado */}
                    {availableSubcategories.length > 4 && (
                        <div className="subcatPickerSearchBox">
                            <div className="subcatSearchInputWrap">
                                <Search size={15} className="subcatSearchIcon" />
                                <input
                                    type="search"
                                    className="subcatPickerSearchInput"
                                    placeholder="Buscar subcategoría..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                    )}

                    {/* Lista con Selección Múltiple */}
                    <div className="subcatPickerBody">
                        {availableSubcategories.length === 0 ? (
                            <div className="subcatEmptyState">
                                <AlertCircle size={28} className="subcatEmptyIcon" />
                                <p className="subcatEmptyTitle">Sin subcategorías registradas</p>
                                <p className="subcatEmptyDesc">
                                    La categoría principal "{form.category?.name}" no tiene subcategorías hijas creadas en el panel de administración.
                                </p>
                            </div>
                        ) : filteredSubcategories.length === 0 ? (
                            <p className="subcatPickerEmpty">
                                No se encontraron subcategorías con "{searchTerm}".
                            </p>
                        ) : (
                            <div className="subcatPickerList" role="group" aria-label="Lista de subcategorías">
                                {filteredSubcategories.map(sub => {
                                    const isChecked = tempSelectedIds.includes(sub.id);
                                    return (
                                        <label
                                            key={sub.id}
                                            className={`subcatPickerRow ${isChecked ? 'subcatPickerRowActive' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="subcatPickerCheckbox"
                                                checked={isChecked}
                                                onChange={() => handleToggleTempSubcategory(sub.id)}
                                            />
                                            <div className="subcatRowText">
                                                <span className="subcatRowName">{sub.name}</span>
                                                <span className="subcatRowSlug">slug: {sub.slug}</span>
                                            </div>
                                            {isChecked && <Check size={16} className="subcatCheckIcon" />}
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer de Aplicación */}
                    <div className="subcatPickerFooter">
                        <button
                            type="button"
                            className="subcatPickerApplyBtn"
                            onClick={handleApplySelection}
                            disabled={availableSubcategories.length === 0}
                        >
                            Aplicar ({tempSelectedIds.length} seleccionada{tempSelectedIds.length !== 1 ? 's' : ''})
                        </button>
                    </div>
                </div>
            </div>
        );

        if (typeof document === 'undefined') return modalContent;
        return createPortal(modalContent, document.body);
    };

    return (
        <fieldset className={styles.fieldset} style={{ border: 'none', padding: 0, margin: 0 }}>
            <style>{`
                .tabCatContainer {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    padding: 2px 0;
                    width: 100%;
                    box-sizing: border-box;
                }

                .catFieldBlock {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    width: 100%;
                }

                .catFieldLabel {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--color-text-primary, #ffffff);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                /* Botón Invocador del Modal */
                .subcatInvokeBtn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    width: 100%;
                    min-height: 46px;
                    padding: 10px 16px;
                    border: 1px solid var(--color-primary, #769282);
                    background: rgba(118, 146, 130, 0.12);
                    color: var(--color-text-primary, #ffffff);
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    box-sizing: border-box;
                }

                .subcatInvokeBtn:hover:not(:disabled) {
                    background: rgba(118, 146, 130, 0.22);
                    border-color: var(--color-primary-light, #8fa99a);
                }

                .subcatInvokeBtn:disabled {
                    cursor: not-allowed;
                    opacity: 0.5;
                    background: rgba(255, 255, 255, 0.03);
                    border-color: var(--color-border, #374151);
                    color: var(--color-text-secondary, #9ca3af);
                }

                /* Chips de Subcategorías */
                .subcatChipsGrid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    align-items: center;
                    margin-top: 4px;
                }

                .subcatChip {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: var(--color-primary, #769282);
                    color: #ffffff;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 600;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                    animation: chipPopIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes chipPopIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                .subcatChipRemove {
                    background: transparent;
                    border: none;
                    color: #ffffff;
                    font-size: 14px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    padding: 0;
                    transition: background 0.15s ease;
                }

                .subcatChipRemove:hover {
                    background: rgba(0, 0, 0, 0.3);
                }

                .subcatAddMoreBtn {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    min-height: 34px;
                    padding: 4px 12px;
                    border: 1px dashed var(--color-primary, #769282);
                    background: rgba(118, 146, 130, 0.08);
                    color: var(--color-primary-light, #8fa99a);
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .subcatAddMoreBtn:hover {
                    background: rgba(118, 146, 130, 0.18);
                    color: #ffffff;
                }

                .catHintNotice {
                    font-size: 12px;
                    color: var(--color-text-secondary, #9ca3af);
                    margin: 4px 0 0 0;
                    line-height: 1.4;
                }

                /* MODAL / BOTTOM SHEET OVERLAY */
                .subcatPickerOverlay {
                    position: fixed;
                    inset: 0;
                    z-index: 99999;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                }

                .subcatPickerBackdrop {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    -webkit-backdrop-filter: blur(4px);
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    margin: 0;
                }

                @media (min-width: 768px) {
                    .subcatPickerOverlay {
                        align-items: center;
                        padding: 24px;
                    }
                }

                .subcatPickerSheet {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    max-width: 520px;
                    max-height: 82vh;
                    background: var(--color-bg-primary, #111827);
                    border-top-left-radius: 20px;
                    border-top-right-radius: 20px;
                    border: 1px solid var(--color-border, #374151);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
                    animation: sheetSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @media (min-width: 768px) {
                    .subcatPickerSheet {
                        border-radius: 14px;
                        max-height: 75vh;
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                    }
                }

                @keyframes sheetSlideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                .subcatPickerHeader {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 18px;
                    border-bottom: 1px solid var(--color-border, #374151);
                }

                .subcatPickerTitle {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--color-text-primary, #ffffff);
                }

                .subcatPickerSubtitle {
                    margin: 2px 0 0 0;
                    font-size: 12px;
                    color: var(--color-text-secondary, #9ca3af);
                }

                .subcatPickerCloseBtn {
                    background: transparent;
                    border: none;
                    color: var(--color-text-secondary, #9ca3af);
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .subcatPickerCloseBtn:hover {
                    color: var(--color-text-primary, #ffffff);
                    background: rgba(255, 255, 255, 0.05);
                }

                .subcatPickerSearchBox {
                    padding: 10px 18px;
                    background: var(--color-bg-secondary, #1f2937);
                    border-bottom: 1px solid var(--color-border, #374151);
                }

                .subcatSearchInputWrap {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .subcatSearchIcon {
                    position: absolute;
                    left: 12px;
                    color: var(--color-text-secondary, #9ca3af);
                    pointer-events: none;
                }

                .subcatPickerSearchInput {
                    width: 100%;
                    min-height: 40px;
                    font-size: 14px;
                    padding: 0 12px 0 36px;
                    border-radius: 8px;
                    border: 1px solid var(--color-border, #374151);
                    background: var(--color-bg-primary, #111827);
                    color: var(--color-text-primary, #ffffff);
                    box-sizing: border-box;
                }

                .subcatPickerSearchInput:focus {
                    outline: none;
                    border-color: var(--color-primary, #769282);
                }

                .subcatPickerBody {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px 14px;
                    -webkit-overflow-scrolling: touch;
                }

                .subcatPickerList {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .subcatPickerRow {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-height: 46px;
                    padding: 8px 12px;
                    border-radius: 8px;
                    border: 1px solid var(--color-border, rgba(255, 255, 255, 0.06));
                    background: var(--color-bg-secondary, rgba(255, 255, 255, 0.02));
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .subcatPickerRow:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .subcatPickerRowActive {
                    border-color: var(--color-primary, #769282);
                    background: rgba(118, 146, 130, 0.12);
                }

                .subcatPickerCheckbox {
                    width: 20px;
                    height: 20px;
                    accent-color: var(--color-primary, #769282);
                    cursor: pointer;
                    flex-shrink: 0;
                }

                .subcatRowText {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                    flex: 1;
                }

                .subcatRowName {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--color-text-primary, #ffffff);
                }

                .subcatRowSlug {
                    font-size: 11px;
                    color: var(--color-text-secondary, #9ca3af);
                    font-family: monospace;
                }

                .subcatCheckIcon {
                    color: var(--color-primary, #769282);
                    flex-shrink: 0;
                }

                .subcatEmptyState {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    padding: 30px 16px;
                    gap: 6px;
                }

                .subcatEmptyIcon {
                    color: var(--color-accent, #DDB08C);
                    margin-bottom: 4px;
                }

                .subcatEmptyTitle {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 700;
                    color: var(--color-text-primary, #ffffff);
                }

                .subcatEmptyDesc {
                    margin: 0;
                    font-size: 12px;
                    color: var(--color-text-secondary, #9ca3af);
                    line-height: 1.4;
                }

                .subcatPickerEmpty {
                    padding: 24px;
                    text-align: center;
                    color: var(--color-text-secondary, #9ca3af);
                    font-size: 13px;
                }

                .subcatPickerFooter {
                    padding: 12px 18px;
                    border-top: 1px solid var(--color-border, #374151);
                    background: var(--color-bg-secondary, #1f2937);
                }

                .subcatPickerApplyBtn {
                    width: 100%;
                    min-height: 44px;
                    border: none;
                    border-radius: 8px;
                    background: var(--color-primary, #769282);
                    color: #ffffff;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: background 0.15s ease;
                }

                .subcatPickerApplyBtn:hover:not(:disabled) {
                    background: var(--color-primary-dark, #5d7568);
                }

                .subcatPickerApplyBtn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>

            <div className="tabCatContainer">
                {/* ── 1. Categoría Principal ── */}
                <div className="catFieldBlock">
                    <label className="catFieldLabel" htmlFor="product-category">
                        Categoría Principal *
                    </label>
                    <Dropdown
                        id="product-category"
                        options={primaryCategoryOptions}
                        value={form.category?.id || ''}
                        onChange={onPrimaryCategoryChange}
                        placeholder="Seleccioná la categoría principal..."
                        className={fieldErrors.category ? styles.inputError : ''}
                        ariaInvalid={Boolean(fieldErrors.category)}
                    />
                    {fieldErrors.category && (
                        <span className={styles.errorText} role="alert">{fieldErrors.category}</span>
                    )}
                </div>

                {/* ── 2. Subcategorías Asociadas (Ubicado inmediatamente abajo) ── */}
                <div className="catFieldBlock">
                    <label className="catFieldLabel" htmlFor="subcat-invoke-btn">
                        <Layers size={14} /> Subcategorías Asociadas
                    </label>

                    {selectedSubcategoryObjects.length === 0 ? (
                        <>
                            <button
                                id="subcat-invoke-btn"
                                type="button"
                                className="subcatInvokeBtn"
                                onClick={openSubcategoryPicker}
                                disabled={!hasPrimaryCategory}
                                aria-label={hasPrimaryCategory ? 'Asociar subcategorías al producto' : 'Seleccioná primero una categoría principal'}
                            >
                                <Plus size={16} />
                                <span>Asociar Subcategorías</span>
                            </button>
                            {!hasPrimaryCategory && (
                                <p className="catHintNotice">
                                    ℹ️ Seleccioná primero una Categoría Principal para habilitar sus subcategorías.
                                </p>
                            )}
                        </>
                    ) : (
                        <div className="subcatChipsGrid">
                            {selectedSubcategoryObjects.map(sub => (
                                <span key={sub.id} className="subcatChip">
                                    {sub.name}
                                    <button
                                        type="button"
                                        className="subcatChipRemove"
                                        onClick={e => handleRemoveChip(sub.id, e)}
                                        aria-label={`Quitar subcategoría ${sub.name}`}
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}

                            <button
                                type="button"
                                className="subcatAddMoreBtn"
                                onClick={openSubcategoryPicker}
                                disabled={!hasPrimaryCategory}
                                aria-label="Gestionar más subcategorías"
                            >
                                <Plus size={12} /> Modificar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Bottom Sheet Portaleado */}
            {renderModal()}
        </fieldset>
    );
});