import { forwardRef, useImperativeHandle, useState } from 'react';
import type { TabPreciosInventarioProps } from '../components/types';

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

    useImperativeHandle(ref, () => ({
        validate: () => {
            const errs: Record<string, string> = {};
            if (!form.price || form.price <= 0) errs.price = 'El precio debe ser mayor a 0';
            if (form.originalPrice !== undefined && form.originalPrice <= 0) errs.originalPrice = 'El precio original debe ser mayor a 0';
            // ...otras validaciones...
            setLocalErrors(errs);
            return errs;
        }
    }), [form]);

    return (
        <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Precio y stock</legend>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-price">Precio *</label>
                    <input
                        className={`${styles.input} ${localErrors.price ? styles.inputError : ''}`}
                        id="product-price"
                        type="number"
                        min={0}
                        step={0.01}
                        value={form.price}
                        onChange={e => setField('price', Number(e.target.value))}
                        required
                    />
                    {localErrors.price && <span className={styles.errorText}>{localErrors.price}</span>}
                </div>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-original-price">Precio original</label>
                    <input
                        className={`${styles.input} ${localErrors.originalPrice ? styles.inputError : ''}`}
                        id="product-original-price"
                        type="number"
                        min={0}
                        step={0.01}
                        value={form.originalPrice ?? ''}
                        onChange={e =>
                            setField('originalPrice', e.target.value ? Number(e.target.value) : undefined)
                        }
                    />
                    {localErrors.originalPrice && (
                        <span className={styles.errorText}>{localErrors.originalPrice}</span>
                    )}
                </div>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-discount">Descuento (%)</label>
                    <input
                        className={`${styles.input} ${localErrors.discount ? styles.inputError : ''}`}
                        id="product-discount"
                        type="number"
                        min={0}
                        max={100}
                        value={form.discount ?? ''}
                        onChange={e =>
                            setField('discount', e.target.value ? Number(e.target.value) : undefined)
                        }
                    />
                    {localErrors.discount && (
                        <span className={styles.errorText}>{localErrors.discount}</span>
                    )}
                </div>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-stock">Stock</label>
                    <input
                        className={`${styles.input} ${localErrors.stock ? styles.inputError : ''}`}
                        id="product-stock"
                        type="number"
                        min={0}
                        value={form.stock}
                        onChange={e => setField('stock', Number(e.target.value))}
                    />
                    {localErrors.stock && <span className={styles.errorText}>{localErrors.stock}</span>}
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