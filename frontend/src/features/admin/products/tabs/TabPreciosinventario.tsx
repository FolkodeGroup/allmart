import { forwardRef, useImperativeHandle, useState, useCallback, useEffect } from 'react';
import type { TabPreciosInventarioProps } from '../components/types';
import { getInlineFieldError } from '../../../../utils/productFormUtils';
import { ValidationHelper } from '../components/ValidationHelper';
import { useAdminVariants } from '../../../../hooks/useAdminVariants';
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
    const { skus } = useAdminVariants();

    useEffect(() => {
        setLocalErrors(errors);
    }, [errors]);

    const formValues = form as unknown as {
        price: number;
        stock: number;
        inStock: boolean;
        criticalStockThreshold?: number;
    };

    // 🟢 FIX UX: Solo considerar que hay variantes activas si existen combinaciones/SKUs reales creadas
    const hasActiveSkus = (skus && skus.length > 0) || (Array.isArray((form as unknown as { skus?: unknown[] }).skus) && (form as unknown as { skus: unknown[] }).skus.length > 0);

    useImperativeHandle(ref, () => ({
        validate: () => {
            const errs: Record<string, string> = {};
            if (!hasActiveSkus) {
                if (!formValues.price || formValues.price <= 0) errs.price = 'El precio debe ser mayor a 0';
                // Permitimos stock negativo (ej. -2) por diseño; las alertas se calculan contra el umbral crítico
                if (formValues.criticalStockThreshold !== undefined && formValues.criticalStockThreshold < 0) {
                    errs.criticalStockThreshold = 'El umbral de stock crítico no puede ser negativo';
                }
            }
            setLocalErrors(errs);
            return errs;
        }
    }), [formValues, hasActiveSkus]);

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
        color: hasActiveSkus ? 'var(--color-text-muted)' : 'var(--color-primary)',
        fontSize: '1.1rem',
        pointerEvents: 'none',
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    return (
        <fieldset className={styles.fieldset}>
            {hasActiveSkus && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(118, 146, 130, 0.12)', border: '1px solid var(--color-primary)', borderRadius: '10px', color: 'var(--color-text-primary)' }}>
                    <i className="bi bi-info-circle-fill" style={{ marginRight: '8px', color: 'var(--color-primary)' }}></i>
                    <strong>Gestión de inventario por variantes activa.</strong> El precio base y el stock general se calculan automáticamente consolidando las combinaciones activas en la pestaña <strong>Variantes</strong>.
                </div>
            )}

            <div className={styles.row}>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-price">Precio {hasActiveSkus ? '' : '*'}</label>
                    <div className={styles.inputWithIcon} style={{ position: 'relative' }}>
                        <i className="bi bi-currency-dollar" style={iconStyle}></i>
                        <input
                            aria-invalid={!!localErrors.price}
                            className={`${styles.input} ${localErrors.price ? styles.inputError : ''}`}
                            style={{ paddingLeft: '36px', minHeight: '44px', fontSize: '16px', backgroundColor: hasActiveSkus ? 'var(--color-bg-secondary)' : undefined }}
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
                            required={!hasActiveSkus}
                            disabled={hasActiveSkus}
                        />
                    </div>
                    {!hasActiveSkus && (touched.price || localErrors.price) && (
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
                            aria-invalid={!!localErrors.stock}
                            className={`${styles.input} ${localErrors.stock ? styles.inputError : ''}`}
                            style={{ paddingLeft: '36px', minHeight: '44px', fontSize: '16px', backgroundColor: hasActiveSkus ? 'var(--color-bg-secondary)' : undefined }}
                            id="product-stock"
                            type="number"
                            value={formValues.stock === 0 ? '' : formValues.stock}
                            onChange={e => {
                                const raw = e.target.value;
                                const val = raw === '' ? 0 : Number(raw);
                                setField('stock', val);
                                validateField('stock', val);
                            }}
                            placeholder="0"
                            onBlur={() => handleBlur('stock')}
                            disabled={hasActiveSkus}
                        />
                    </div>
                    {!hasActiveSkus && (touched.stock || localErrors.stock) && (
                        <ValidationHelper
                            error={localErrors.stock}
                            success={!localErrors.stock}
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
                            style={{ paddingLeft: '36px', minHeight: '44px', fontSize: '16px', backgroundColor: hasActiveSkus ? 'var(--color-bg-secondary)' : undefined }}
                            id="product-critical-threshold"
                            type="number"
                            min={0}
                            value={formValues.criticalStockThreshold === undefined ? 5 : (formValues.criticalStockThreshold === 0 ? '' : formValues.criticalStockThreshold)}
                            onChange={e => {
                                const raw = e.target.value;
                                const val = raw === '' ? 0 : Math.max(0, parseInt(raw) || 0);
                                setField('criticalStockThreshold' as unknown as Parameters<typeof setField>[0], val);
                                validateField('criticalStockThreshold', val);
                            }}
                            placeholder="5"
                            onBlur={() => handleBlur('criticalStockThreshold')}
                            disabled={hasActiveSkus}
                        />
                    </div>
                    <p className={styles.fieldHint} style={{ marginTop: '4px' }}>
                        Se generarán alertas automáticas en el panel si el stock desciende por debajo de este valor.
                    </p>
                    {!hasActiveSkus && touched.criticalStockThreshold && (
                        <ValidationHelper
                            error={localErrors.criticalStockThreshold}
                            success={!!(formValues.criticalStockThreshold !== undefined && formValues.criticalStockThreshold >= 0 && !localErrors.criticalStockThreshold)}
                        />
                    )}
                </div>
            </div>

            <div className={styles.checkRow} style={{ marginTop: '1rem', minHeight: '44px', display: 'flex', alignItems: 'center', opacity: hasActiveSkus ? 0.5 : 1, pointerEvents: hasActiveSkus ? 'none' : 'auto' }}>
                <input
                    type="checkbox"
                    id="inStock"
                    checked={formValues.inStock}
                    onChange={e => setField('inStock', e.target.checked)}
                    style={{ cursor: 'pointer', width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
                    disabled={hasActiveSkus}
                />
                <label htmlFor="inStock" className={styles.checkLabel} style={{ cursor: 'pointer', userSelect: 'none', marginLeft: '8px' }}>
                    Disponible en stock
                </label>
            </div>
        </fieldset>
    );
});