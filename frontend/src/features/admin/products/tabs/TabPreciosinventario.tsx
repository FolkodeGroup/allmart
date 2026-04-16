import { forwardRef, useImperativeHandle, useState, useCallback, useMemo } from 'react';
import type { TabPreciosInventarioProps } from '../components/types';
import { getInlineFieldError } from '../../../../utils/productFormUtils';
import { ValidationHelper } from '../components/ValidationHelper';

export type TabPreciosInventarioRef = {
    validate: () => Record<string, string>;
};
import styles from '../AdminProductForm.module.css';

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
            if (form.originalPrice !== undefined && form.originalPrice <= 0) errs.originalPrice = 'El precio original debe ser mayor a 0';
            if (form.discount !== undefined && (form.discount < 0 || form.discount > 100)) {
                errs.discount = 'El descuento debe estar entre 0 y 100';
            }
            if (form.stock < 0) errs.stock = 'El stock no puede ser negativo';
            setLocalErrors(errs);
            return errs;
        }
    }), [form]);

    // Validación inline para cada campo
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

    // Calcular descuento sugerido basado en precios
    const suggestedDiscount = useMemo(() => {
        if (!form.originalPrice || form.originalPrice <= 0 || !form.price || form.price >= form.originalPrice) {
            return null;
        }
        const discount = Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100);
        return discount > 0 && discount <= 100 ? discount : null;
    }, [form.originalPrice, form.price]);

    const priceWarning = useMemo(() => {
        if (form.originalPrice && form.originalPrice <= form.price) {
            return 'El precio original debe ser mayor que el precio actual para que haya descuento';
        }
        return undefined;
    }, [form.originalPrice, form.price]);

    return (
        <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Precio y stock</legend>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-price">Precio *</label>
                    <input
                        className={`${styles.input} ${touched.price && localErrors.price ? styles.inputError : ''}`}
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
                    {touched.price && (
                        <ValidationHelper
                            error={localErrors.price}
                            success={!!(form.price > 0 && !localErrors.price)}
                            hint={!localErrors.price ? 'Ingresa el precio de venta' : undefined}
                        />
                    )}
                </div>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-original-price">Precio original</label>
                    <input
                        className={`${styles.input} ${touched.originalPrice && localErrors.originalPrice ? styles.inputError : ''}`}
                        id="product-original-price"
                        type="number"
                        min={0}
                        step={0.01}
                        value={form.originalPrice ?? ''}
                        onChange={e => {
                            const val = e.target.value ? Number(e.target.value) : undefined;
                            setField('originalPrice', val);
                            validateField('originalPrice', val);
                        }}
                        onBlur={() => handleBlur('originalPrice')}
                    />
                    {touched.originalPrice && (
                        <ValidationHelper
                            error={localErrors.originalPrice}
                            warning={priceWarning}
                            success={!!(!localErrors.originalPrice && form.originalPrice && form.originalPrice > form.price)}
                            hint={!localErrors.originalPrice ? 'Déjalo en blanco si no hay descuento' : undefined}
                        />
                    )}
                </div>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-discount">Descuento (%)</label>
                    <input
                        className={`${styles.input} ${touched.discount && localErrors.discount ? styles.inputError : ''}`}
                        id="product-discount"
                        type="number"
                        min={0}
                        max={100}
                        value={form.discount ?? ''}
                        onChange={e => {
                            const val = e.target.value ? Number(e.target.value) : undefined;
                            setField('discount', val);
                            validateField('discount', val);
                        }}
                        onBlur={() => handleBlur('discount')}
                    />
                    {touched.discount && (
                        <ValidationHelper
                            error={localErrors.discount}
                            success={!!(form.discount !== undefined && !localErrors.discount)}
                            suggestion={
                                suggestedDiscount && form.discount !== suggestedDiscount ? (
                                    <div>
                                        <strong>Descuento sugerido:</strong> {suggestedDiscount}%
                                    </div>
                                ) : null
                            }
                            hint={!localErrors.discount ? 'Entre 0 y 100%' : undefined}
                        />
                    )}
                </div>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-stock">Stock</label>
                    <input
                        className={`${styles.input} ${touched.stock && localErrors.stock ? styles.inputError : ''}`}
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
                    {touched.stock && (
                        <ValidationHelper
                            error={localErrors.stock}
                            success={!!(form.stock >= 0 && !localErrors.stock)}
                            hint={!localErrors.stock ? `Cantidad disponible: ${form.stock}` : undefined}
                        />
                    )}
                </div>
            </div>

            <div className={styles.checkRow}>
                <input
                    type="checkbox"
                    id="inStock"
                    checked={form.inStock}
                    onChange={e => setField('inStock', e.target.checked)}
                />
                <label htmlFor="inStock" className={styles.checkLabel}>Disponible en stock</label>
            </div>

            <div className={styles.checkRow}>
                <input
                    type="checkbox"
                    id="isFeatured"
                    checked={form.isFeatured || false}
                    onChange={e => setField('isFeatured', e.target.checked)}
                />
                <label htmlFor="isFeatured" className={styles.checkLabel}>
                    Marcar como producto destacado
                </label>
            </div>
        </fieldset>
    );
});