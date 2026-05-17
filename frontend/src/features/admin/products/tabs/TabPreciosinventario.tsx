import { forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import type { TabPreciosInventarioProps } from '../components/types';
import { getInlineFieldError } from '../../../../utils/productFormUtils';
import { ValidationHelper } from '../components/ValidationHelper';

export type TabPreciosInventarioRef = {
    validate: () => Record<string, string>;
};
import styles from '../AdminProductFormPage.module.css';

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