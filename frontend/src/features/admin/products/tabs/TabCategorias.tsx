import React, { memo, useMemo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { TabFormState, SetField } from '../components/types';
import type { Category } from '../../../../types';
import styles from '../AdminProductFormPage.module.css';
import { Dropdown } from '../../../../components/ui/Dropdown/Dropdown';

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
    const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
    const hasPrimaryCategory = Boolean(form.category?.id);

    // Sincronizar selección temporal cuando cambian las props o se abre el modal
    useEffect(() => {
        setTempSelectedIds(additionalCategoryIds);
    }, [additionalCategoryIds, modalOpen]);

    const openCategoryPicker = useCallback(() => {
        if (!hasPrimaryCategory) return;
        setModalOpen(true);
    }, [hasPrimaryCategory]);

    // Opciones para la categoría principal con ruta breadcrumb limpia
    const primaryCategoryOptions = useMemo(() => {
        return categories.map(c => {
            const label = getCategoryLabel(c);
            return {
                value: c.id,
                label: label.replace(' > ', ' › ')
            };
        });
    }, [categories, getCategoryLabel]);

    // Categorías disponibles para adicionales (excluye la principal)
    const availableCategories = useMemo(() => {
        return categories.filter(c => c.id !== form.category.id);
    }, [categories, form.category.id]);

    // Categorías filtradas por búsqueda
    const filteredCategories = useMemo(() => {
        if (!searchTerm.trim()) return availableCategories;
        const q = searchTerm.toLowerCase().trim();
        return availableCategories.filter(c => {
            const label = getCategoryLabel(c).toLowerCase();
            return label.includes(q) || c.slug.toLowerCase().includes(q);
        });
    }, [availableCategories, searchTerm, getCategoryLabel]);

    // Agrupamiento por categorías padre
    const groupedCategories = useMemo(() => {
        const parents = availableCategories.filter(c => !c.parentId);
        const childrenMap = new Map<string, Category[]>();

        availableCategories.forEach(c => {
            if (c.parentId) {
                const list = childrenMap.get(c.parentId) || [];
                list.push(c);
                childrenMap.set(c.parentId, list);
            }
        });

        return { parents, childrenMap };
    }, [availableCategories]);

    // Auto-expandir carpetas padre cuando hay búsqueda activa
    useEffect(() => {
        if (searchTerm.trim()) {
            const nextExpanded: Record<string, boolean> = {};
            groupedCategories.parents.forEach(p => {
                nextExpanded[p.id] = true;
            });
            setExpandedParents(nextExpanded);
        }
    }, [searchTerm, groupedCategories.parents]);

    // Conmutador de expansión de carpetas padre
    const toggleParentExpand = useCallback((parentId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedParents(prev => ({ ...prev, [parentId]: !prev[parentId] }));
    }, []);

    // Simulación de evento de React para actualizar categorías adicionales en el formulario principal
    const updateAdditionalCategories = useCallback((nextIds: string[]) => {
        onAdditionalCategoriesChange({
            target: {
                selectedOptions: nextIds.map(id => ({ value: id }))
            }
        } as unknown as React.ChangeEvent<HTMLSelectElement>);
    }, [onAdditionalCategoriesChange]);

    // Handlers para el modal
    const handleToggleTempCategory = useCallback((categoryId: string) => {
        setTempSelectedIds(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    }, []);

    const handleApplySelection = useCallback(() => {
        updateAdditionalCategories(tempSelectedIds);
        setModalOpen(false);
        setSearchTerm('');
    }, [tempSelectedIds, updateAdditionalCategories]);

    const handleRemoveChip = useCallback((categoryId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const nextIds = additionalCategoryIds.filter(id => id !== categoryId);
        updateAdditionalCategories(nextIds);
    }, [additionalCategoryIds, updateAdditionalCategories]);

    // Categorías adicionales seleccionadas para renderizar Chips
    const selectedAdditionalCategories = useMemo(() => {
        return additionalCategoryIds
            .map(id => categories.find(c => c.id === id))
            .filter((c): c is Category => Boolean(c));
    }, [additionalCategoryIds, categories]);

    // Modal / Bottom-Sheet portaleado a document.body con accesibilidad garantizada
    const renderModal = () => {
        if (!modalOpen) return null;

        const isSearching = !!searchTerm.trim();

        const modalContent = (
            <div className="catPickerOverlay" role="presentation">
                <button
                    type="button"
                    className="catPickerBackdropBtn"
                    onClick={() => setModalOpen(false)}
                    aria-label="Cerrar modal"
                    tabIndex={-1}
                />
                <div
                    className="catPickerSheet"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cat-picker-title"
                >
                    {/* Header */}
                    <div className="catPickerHeader">
                        <div>
                            <h3 id="cat-picker-title" className="catPickerTitle">
                                Categorías adicionales
                            </h3>
                            <p className="catPickerSubtitle">
                                Seleccioná una o más categorías secundarias
                            </p>
                        </div>
                        <button
                            type="button"
                            className="catPickerCloseBtn"
                            onClick={() => setModalOpen(false)}
                            aria-label="Cerrar ventana"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Buscador */}
                    <div className="catPickerSearchBox">
                        <input
                            type="search"
                            className="catPickerSearchInput"
                            placeholder="Buscar categoría..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoComplete="off"
                            // eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus
                        />
                    </div>

                    {/* Cuerpo con árbol jerárquico */}
                    <div className="catPickerBody">
                        {isSearching ? (
                            /* Modo búsqueda: listado plano con breadcrumbs */
                            filteredCategories.length === 0 ? (
                                <p className="catPickerEmpty">No se encontraron categorías con "{searchTerm}".</p>
                            ) : (
                                <div className="catPickerList">
                                    {filteredCategories.map(cat => {
                                        const isChecked = tempSelectedIds.includes(cat.id);
                                        const breadcrumb = getCategoryLabel(cat).replace(' > ', ' › ');
                                        return (
                                            <label key={cat.id} className="catPickerRow">
                                                <input
                                                    type="checkbox"
                                                    className="catPickerCheckbox"
                                                    checked={isChecked}
                                                    onChange={() => handleToggleTempCategory(cat.id)}
                                                />
                                                <span className="catPickerRowLabel">{breadcrumb}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )
                        ) : (
                            /* Modo normal: árbol jerárquico colapsable */
                            <div className="catPickerTree">
                                {groupedCategories.parents.map(parent => {
                                    const subcats = groupedCategories.childrenMap.get(parent.id) || [];
                                    const isParentChecked = tempSelectedIds.includes(parent.id);
                                    const isExpanded = !!expandedParents[parent.id];
                                    const hasSubcats = subcats.length > 0;

                                    return (
                                        <div key={parent.id} className="catPickerTreeGroup">
                                            {/* Fila Padre */}
                                            <div className="catPickerParentRow">
                                                <label className="catPickerRowLabelWrap">
                                                    <input
                                                        type="checkbox"
                                                        className="catPickerCheckbox"
                                                        checked={isParentChecked}
                                                        onChange={() => handleToggleTempCategory(parent.id)}
                                                    />
                                                    <span className="catPickerParentName">{parent.name}</span>
                                                </label>

                                                {hasSubcats && (
                                                    <button
                                                        type="button"
                                                        className="catPickerExpandToggle"
                                                        onClick={e => toggleParentExpand(parent.id, e)}
                                                        aria-label={isExpanded ? 'Colapsar subcategorías' : 'Expandir subcategorías'}
                                                    >
                                                        {subcats.length} {isExpanded ? '▲' : '▼'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Subcategorías con indentación por borde izquierdo */}
                                            {hasSubcats && isExpanded && (
                                                <div className="catPickerSubTree">
                                                    {subcats.map(sub => {
                                                        const isSubChecked = tempSelectedIds.includes(sub.id);
                                                        return (
                                                            <label key={sub.id} className="catPickerSubRow">
                                                                <input
                                                                    type="checkbox"
                                                                    className="catPickerCheckbox"
                                                                    checked={isSubChecked}
                                                                    onChange={() => handleToggleTempCategory(sub.id)}
                                                                />
                                                                <span className="catPickerSubName">{sub.name}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer de acciones */}
                    <div className="catPickerFooter">
                        <button
                            type="button"
                            className="catPickerApplyBtn"
                            onClick={handleApplySelection}
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
                /* Contenedor plano sin cajas ni bordes anidados */
                .tabCatContainer {
                    display: flex;
                    flex-direction: column;
                    gap: 22px;
                    padding: 4px 0;
                }
                .catFieldBlock {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .catFieldHeader {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .catFieldLabel {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--color-text-primary, #ffffff);
                }

                /* Chips planos e interactivos */
                .chipsWrapperFlat {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    align-items: center;
                }
                .catChip {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: var(--color-primary, #769282);
                    color: #ffffff;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 600;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
                }
                .catChipRemove {
                    background: transparent;
                    border: none;
                    color: #ffffff;
                    font-size: 14px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    padding: 0;
                    margin-left: 2px;
                }
                .catChipRemove:hover {
                    background: rgba(0,0,0,0.25);
                }

                /* Botón de acción principal limpio */
                .addCatActionButton {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    width: 100%;
                    min-height: 48px;
                    padding: 12px 16px;
                    border: 1px solid var(--color-primary, #769282);
                    background: rgba(118, 146, 130, 0.12);
                    color: var(--color-text-primary, #ffffff);
                    border-radius: 10px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .addCatActionButton:disabled {
                    cursor: not-allowed;
                    opacity: 0.55;
                    background: rgba(118, 146, 130, 0.08);
                    border-color: var(--color-border, #4b5563);
                    color: var(--color-text-secondary, #9ca3af);
                }
                .addCatActionButton:active:not(:disabled) {
                    background: rgba(118, 146, 130, 0.25);
                }

                .addMoreCatBtn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    min-height: 36px;
                    padding: 4px 12px;
                    border: 1px solid var(--color-border, #4b5563);
                    background: var(--color-bg-secondary, #28353d);
                    color: var(--color-text-primary, #ffffff);
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .addMoreCatBtn:disabled {
                    cursor: not-allowed;
                    opacity: 0.55;
                }
                .catHintText {
                    margin: 6px 2px 0;
                    font-size: 12px;
                    line-height: 1.4;
                    color: var(--color-text-secondary, #9ca3af);
                }

                /* MODAL / BOTTOM SHEET PORTALEADO */
                .catPickerOverlay {
                    position: fixed;
                    inset: 0;
                    z-index: 99999;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                }
                .catPickerBackdropBtn {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.65);
                    backdrop-filter: blur(4px);
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    margin: 0;
                }
                @media (min-width: 768px) {
                    .catPickerOverlay {
                        align-items: center;
                        padding: 24px;
                    }
                }
                .catPickerSheet {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    max-width: 560px;
                    max-height: 85vh;
                    background: var(--color-bg-primary, #111827);
                    border-top-left-radius: 20px;
                    border-top-right-radius: 20px;
                    border: 1px solid var(--color-border, #374151);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 -10px 30px rgba(0,0,0,0.5);
                    animation: slideUpSheet 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @media (min-width: 768px) {
                    .catPickerSheet {
                        border-radius: 16px;
                        max-height: 80vh;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                    }
                }
                @keyframes slideUpSheet {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .catPickerHeader {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--color-border, #374151);
                }
                .catPickerTitle {
                    margin: 0;
                    font-size: 17px;
                    font-weight: 700;
                    color: var(--color-text-primary, #ffffff);
                }
                .catPickerSubtitle {
                    margin: 2px 0 0 0;
                    font-size: 13px;
                    color: var(--color-text-secondary, #9ca3af);
                }
                .catPickerCloseBtn {
                    background: transparent;
                    border: none;
                    color: var(--color-text-secondary, #9ca3af);
                    font-size: 18px;
                    cursor: pointer;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .catPickerSearchBox {
                    padding: 12px 20px;
                    background: var(--color-bg-secondary, #1f2937);
                    border-bottom: 1px solid var(--color-border, #374151);
                }
                .catPickerSearchInput {
                    width: 100%;
                    min-height: 44px;
                    font-size: 16px;
                    padding: 0 14px;
                    border-radius: 8px;
                    border: 1px solid var(--color-border, #374151);
                    background: var(--color-bg-primary, #111827);
                    color: var(--color-text-primary, #ffffff);
                    box-sizing: border-box;
                }
                .catPickerSearchInput:focus {
                    outline: none;
                    border-color: var(--color-primary, #769282);
                }
                .catPickerBody {
                    flex: 1;
                    overflow-y: auto;
                    padding: 12px 16px;
                    -webkit-overflow-scrolling: touch;
                }
                .catPickerEmpty {
                    padding: 24px;
                    text-align: center;
                    color: var(--color-text-secondary, #9ca3af);
                    font-size: 14px;
                }
                .catPickerList {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .catPickerTree {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .catPickerTreeGroup {
                    border: 1px solid var(--color-border, rgba(255,255,255,0.08));
                    border-radius: 10px;
                    overflow: hidden;
                    background: var(--color-bg-secondary, rgba(255,255,255,0.02));
                }
                .catPickerParentRow {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-height: 48px;
                    padding: 6px 14px;
                    background: rgba(255,255,255,0.03);
                }
                .catPickerRowLabelWrap {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                    cursor: pointer;
                    min-height: 44px;
                }
                .catPickerCheckbox {
                    width: 22px;
                    height: 22px;
                    accent-color: var(--color-primary, #769282);
                    cursor: pointer;
                    flex-shrink: 0;
                }
                .catPickerParentName {
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--color-text-primary, #ffffff);
                }
                .catPickerExpandToggle {
                    background: rgba(255,255,255,0.08);
                    border: none;
                    color: var(--color-text-primary, #ffffff);
                    font-size: 12px;
                    font-weight: 600;
                    padding: 6px 10px;
                    border-radius: 6px;
                    cursor: pointer;
                }
                .catPickerSubTree {
                    padding: 4px 12px 8px 24px;
                    border-left: 2px solid var(--color-primary, #769282);
                    margin: 4px 12px 8px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .catPickerSubRow {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-height: 44px;
                    padding: 4px 8px;
                    cursor: pointer;
                    border-radius: 6px;
                }
                .catPickerSubRow:active {
                    background: rgba(255,255,255,0.05);
                }
                .catPickerSubName {
                    font-size: 14px;
                    color: var(--color-text-primary, #ffffff);
                }
                .catPickerRow {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-height: 48px;
                    padding: 8px 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    cursor: pointer;
                }
                .catPickerRowLabel {
                    font-size: 15px;
                    color: var(--color-text-primary, #ffffff);
                }
                .catPickerFooter {
                    padding: 14px 20px;
                    border-top: 1px solid var(--color-border, #374151);
                    background: var(--color-bg-secondary, #1f2937);
                }
                .catPickerApplyBtn {
                    width: 100%;
                    min-height: 48px;
                    border: none;
                    border-radius: 10px;
                    background: var(--color-primary, #769282);
                    color: #ffffff;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                }
            `}</style>

            <div className="tabCatContainer">
                {/* Categoría Principal */}
                <div className="catFieldBlock">
                    <label className="catFieldLabel" htmlFor="product-category">
                        Categoría Principal *
                    </label>
                    <Dropdown
                        id="product-category"
                        options={primaryCategoryOptions}
                        value={form.category.id}
                        onChange={onPrimaryCategoryChange}
                        placeholder="Seleccioná una categoría..."
                        className={fieldErrors.category ? styles.inputError : ''}
                        ariaInvalid={Boolean(fieldErrors.category)}
                    />
                    {fieldErrors.category && (
                        <span className={styles.errorText} role="alert">{fieldErrors.category}</span>
                    )}
                </div>

                {/* Categorías Adicionales */}
                <div className="catFieldBlock">
                    <div className="catFieldHeader">
                        <label className="catFieldLabel" htmlFor="additional-cat-picker-btn">
                            Categorías adicionales
                        </label>
                    </div>

                    {/* Si NO hay categorías seleccionadas, mostramos un botón de acción directo sin caja vacía */}
                    {selectedAdditionalCategories.length === 0 ? (
                        <>
                            <button
                                id="additional-cat-picker-btn"
                                type="button"
                                className="addCatActionButton"
                                onClick={openCategoryPicker}
                                disabled={!hasPrimaryCategory}
                                title={hasPrimaryCategory ? undefined : 'Seleccione primero una categoría principal'}
                                aria-label={hasPrimaryCategory ? 'Agregar categorías adicionales' : 'Seleccione primero una categoría principal'}
                            >
                                <span>+ Agregar categorías adicionales</span>
                            </button>
                            {!hasPrimaryCategory && (
                                <span className="catHintText" role="status" aria-live="polite">
                                    Seleccione primero una categoría principal
                                </span>
                            )}
                        </>
                    ) : (
                        /* Si SÍ hay categorías seleccionadas, renderizamos Chips con botón para agregar más */
                        <div className="chipsWrapperFlat">
                            {selectedAdditionalCategories.map(c => (
                                <span key={c.id} className="catChip">
                                    {getCategoryLabel(c).replace(' > ', ' › ')}
                                    <button
                                        type="button"
                                        className="catChipRemove"
                                        onClick={e => handleRemoveChip(c.id, e)}
                                        aria-label={`Quitar categoría ${c.name}`}
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}

                            <button
                                id="additional-cat-picker-btn"
                                type="button"
                                className="addMoreCatBtn"
                                onClick={openCategoryPicker}
                                disabled={!hasPrimaryCategory}
                                title={hasPrimaryCategory ? undefined : 'Seleccione primero una categoría principal'}
                                aria-label={hasPrimaryCategory ? 'Agregar más categorías' : 'Seleccione primero una categoría principal'}
                            >
                                + Agregar más
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Portal Modal / Bottom Sheet */}
            {renderModal()}
        </fieldset>
    );
});