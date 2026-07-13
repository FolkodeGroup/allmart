// frontend/src/features/admin/products/tabs/TabPreciosinventario.tsx
import { forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import type { TabPreciosInventarioProps } from '../components/types';
import { getInlineFieldError } from '../../../../utils/productFormUtils';
import { ValidationHelper } from '../components/ValidationHelper';
import styles from '../AdminProductFormPage.module.css';

export type TabPreciosInventarioRef = {
    validate: () => Record<string, string>;
};

export const TabPreciosInventario = forwardRef<TabPreciosInventarioRef, TabPreciosInventarioProps>(function TabPreciosInventario({
    form,
    errors = {},
    setField,
}, ref) {
    const [localErrors, setLocalErrors] = useState<Record<string, string>>(errors);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // 🟢 FIX: Casteo interno seguro para añadir propiedades personalizadas sin romper los tipos de Omit<AdminProduct>
    const formValues = form as unknown as {
        price: number;
        stock: number;
        inStock: boolean;
        criticalStockThreshold?: number;
    };

    const hasVariants = form.variants && form.variants.length > 0;

    useImperativeHandle(ref, () => ({
        validate: () => {
            const errs: Record<string, string> = {};
            if (!hasVariants) {
                if (!formValues.price || formValues.price <= 0) errs.price = 'El precio debe ser mayor a 0';
                if (formValues.stock < 0) errs.stock = 'El stock no puede ser negativo';
                
                // 🟢 NUEVO: Validación de valores positivos para el umbral
                if (formValues.criticalStockThreshold !== undefined && formValues.criticalStockThreshold < 0) {
                    errs.criticalStockThreshold = 'El umbral de stock crítico no puede ser negativo';
                }
            }
            setLocalErrors(errs);
            return errs;
        }
    }), [formValues, hasVariants]);

    const validateField = useCallback((fieldName: string, value: unknown) => {
        const error = getInlineFieldError(value, fieldName);
        setLocalErrors(prev => {
            if (error) {
                return { ...prev, [fieldName]: error };
            }
            const next = { ...prev };
            delete next[fieldName];
            return next;
        });
    }, []);

    const handleBlur = useCallback((fieldName: string) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
    }, []);

    const iconStyle: React.CSSProperties = {
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: hasVariants ? 'var(--color-text-muted)' : 'var(--color-primary)',
        fontSize: '1.1rem',
        pointerEvents: 'none',
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    return (
        <fieldset className={styles.fieldset}>
            {hasVariants && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', color: 'var(--color-text-primary)' }}>
                    <i className="bi bi-info-circle-fill" style={{ marginRight: '8px', color: '#3b82f6' }}></i>
                    <strong>Este producto tiene variantes.</strong> El precio base y el stock general están deshabilitados porque ahora se gestionan individualmente desde la pestaña <strong>Variantes</strong>.
                </div>
            )}

            <div className={styles.row}>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-price">Precio {hasVariants ? '' : '*'}</label>
                    <div className={styles.inputWithIcon} style={{ position: 'relative' }}>
                        <i className="bi bi-currency-dollar" style={iconStyle}></i>
                        <input
                            className={`${styles.input} ${touched.price && localErrors.price ? styles.inputError : ''}`}
                            style={{ paddingLeft: '36px', backgroundColor: hasVariants ? 'var(--color-bg-secondary)' : undefined }}
                            id="product-price"
                            type="number"
                            min={0}
                            step={0.01}
                            value={formValues.price === 0 ? '' : formValues.price}
                            onChange={e => {
                                const raw = e.target.value;
                                const val = raw === '' ? 0 : Number(raw);
                                setField('price', val);
                                validateField('price', val);
                            }}
                            placeholder="0"
                            onBlur={() => handleBlur('price')}
                            required={!hasVariants}
                            disabled={hasVariants}
                        />
                    </div>
                    {!hasVariants && touched.price && (
                        <ValidationHelper
                            error={localErrors.price}
                            success={!!(formValues.price > 0 && !localErrors.price)}
                        />
                    )}
                </div>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-stock">Stock</label>
                    <div className={styles.inputWithIcon} style={{ position: 'relative' }}>
                        <i className="bi bi-box-seam" style={iconStyle}></i>
                        <input
                            className={`${styles.input} ${touched.stock && localErrors.stock ? styles.inputError : ''}`}
                            style={{ paddingLeft: '36px', backgroundColor: hasVariants ? 'var(--color-bg-secondary)' : undefined }}
                            id="product-stock"
                            type="number"
                            min={0}
                            value={formValues.stock === 0 ? '' : formValues.stock}
                            onChange={e => {
                                const raw = e.target.value;
                                const val = raw === '' ? 0 : Number(raw);
                                setField('stock', val);
                                validateField('stock', val);
                            }}
                            placeholder="0"
                            onBlur={() => handleBlur('stock')}
                            disabled={hasVariants}
                        />
                    </div>
                    {!hasVariants && touched.stock && (
                        <ValidationHelper
                            error={localErrors.stock}
                            success={!!(formValues.stock >= 0 && !localErrors.stock)}
                        />
                    )}
                </div>
            </div>

            <div className={styles.row} style={{ marginTop: '1rem' }}>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-critical-threshold">Umbral de stock crítico</label>
                    <div className={styles.inputWithIcon} style={{ position: 'relative' }}>
                        <i className="bi bi-exclamation-triangle" style={iconStyle}></i>
                        <input
                            className={`${styles.input} ${touched.criticalStockThreshold && localErrors.criticalStockThreshold ? styles.inputError : ''}`}
                            style={{ paddingLeft: '36px', backgroundColor: hasVariants ? 'var(--color-bg-secondary)' : undefined }}
                            id="product-critical-threshold"
                            type="number"
                            min={0}
                            value={formValues.criticalStockThreshold === undefined ? 5 : (formValues.criticalStockThreshold === 0 ? '' : formValues.criticalStockThreshold)}
                            onChange={e => {
                                const raw = e.target.value;
                                const val = raw === '' ? 0 : Math.max(0, parseInt(raw) || 0);
                                // 🟢 FIX: Caseteo seguro usando Parameters para evitar 'any' y pasar ESLint
                                setField('criticalStockThreshold' as unknown as Parameters<typeof setField>[0], val);
                                validateField('criticalStockThreshold', val);
                            }}
                            placeholder="5"
                            onBlur={() => handleBlur('criticalStockThreshold')}
                            disabled={hasVariants}
                        />
                    </div>
                    <p className={styles.fieldHint} style={{ marginTop: '4px' }}>
                        Se generarán alertas automáticas en el panel si el stock desciende por debajo de este valor.
                    </p>
                    {!hasVariants && touched.criticalStockThreshold && (
                        <ValidationHelper
                            error={localErrors.criticalStockThreshold}
                            success={!!(formValues.criticalStockThreshold !== undefined && formValues.criticalStockThreshold >= 0 && !localErrors.criticalStockThreshold)}
                        />
                    )}
                </div>
            </div>

            <div className={styles.checkRow} style={{ marginTop: '1rem', opacity: hasVariants ? 0.5 : 1, pointerEvents: hasVariants ? 'none' : 'auto' }}>
                <input
                    type="checkbox"
                    id="inStock"
                    checked={formValues.inStock}
                    onChange={e => setField('inStock', e.target.checked)}
                    style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                    disabled={hasVariants}
                />
                <label htmlFor="inStock" className={styles.checkLabel} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Disponible en stock
                </label>
            </div>
        </fieldset>
    );
});