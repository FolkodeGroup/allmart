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

    useImperativeHandle(ref, () => ({
        validate: () => {
            const errs: Record<string, string> = {};
            if (!form.price || form.price <= 0) errs.price = 'El precio debe ser mayor a 0';
            if (form.stock < 0) errs.stock = 'El stock no puede ser negativo';
            setLocalErrors(errs);
            return errs;
        }
    }), [form]);

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

    // Estilo común para los iconos dentro del input
    const iconStyle: React.CSSProperties = {
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--color-primary)',
        fontSize: '1.1rem',
        pointerEvents: 'none',
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    return (
        <fieldset className={styles.fieldset}>
            <div className={styles.row}>
                {/* ── Campo Precio ── */}
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-price">Precio *</label>
                    <div className={styles.inputWithIcon} style={{ position: 'relative' }}>
                        <i className="bi bi-currency-dollar" style={iconStyle}></i>
                        <input
                            className={`${styles.input} ${touched.price && localErrors.price ? styles.inputError : ''}`}
                            style={{ paddingLeft: '36px' }}
                            id="product-price"
                            type="number"
                            min={0}
                            step={0.01}
                            value={form.price}
                            onChange={e => {
                                const val = Number(e.target.value);
                                setField('price', val);
                                validateField('price', val);
                            }}
                            onBlur={() => handleBlur('price')}
                            required
                        />
                    </div>
                    {touched.price && (
                        <ValidationHelper
                            error={localErrors.price}
                            success={!!(form.price > 0 && !localErrors.price)}
                            
                        />
                    )}
                </div>

                {/* ── Campo Stock ── */}
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-stock">Stock</label>
                    <div className={styles.inputWithIcon} style={{ position: 'relative' }}>
                        <i className="bi bi-box-seam" style={iconStyle}></i>
                        <input
                            className={`${styles.input} ${touched.stock && localErrors.stock ? styles.inputError : ''}`}
                            style={{ paddingLeft: '36px' }}
                            id="product-stock"
                            type="number"
                            min={0}
                            value={form.stock}
                            onChange={e => {
                                const val = Number(e.target.value);
                                setField('stock', val);
                                validateField('stock', val);
                            }}
                            onBlur={() => handleBlur('stock')}
                        />
                    </div>
                    {touched.stock && (
                        <ValidationHelper
                            error={localErrors.stock}
                            success={!!(form.stock >= 0 && !localErrors.stock)}
                            
                        />
                    )}
                </div>
            </div>

            <div className={styles.checkRow} style={{ marginTop: '1rem' }}>
                <input
                    type="checkbox"
                    id="inStock"
                    checked={form.inStock}
                    onChange={e => setField('inStock', e.target.checked)}
                    style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                />
                <label htmlFor="inStock" className={styles.checkLabel} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Disponible en stock
                </label>
            </div>

            <div className={styles.checkRow} style={{ marginTop: '0.75rem' }}>
                <input
                    type="checkbox"
                    id="isFeatured"
                    checked={form.isFeatured || false}
                    onChange={e => setField('isFeatured', e.target.checked)}
                    style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                />
                <label htmlFor="isFeatured" className={styles.checkLabel} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Marcar como producto destacado
                </label>
            </div>
        </fieldset>
    );
});