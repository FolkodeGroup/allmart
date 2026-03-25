import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bulkEditSchema, type BulkEditSchema } from '../../../schemas/bulkEditSchema';
import styles from './BulkEditBar.module.css';

interface BulkEditBarProps {
  selectedCount: number;
  onBulkEdit: (data: { price?: number; stock?: number; inStock?: boolean }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const BulkEditBar: React.FC<BulkEditBarProps> = ({
  selectedCount,
  onBulkEdit,
  onCancel,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    reset,
  } = useForm<BulkEditSchema>({
    resolver: zodResolver(bulkEditSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { price: '', stock: '', inStock: '' },
  });

  const onSubmit = (data: BulkEditSchema) => {
    const priceVal = data.price ? Number(data.price) : undefined;
    const stockVal = data.stock ? Number(data.stock) : undefined;
    const inStockVal = data.inStock ? data.inStock === 'true' : undefined;
    onBulkEdit({ price: priceVal, stock: stockVal, inStock: inStockVal });
    reset();
  };

  return (
    <form
      className={styles.bulkEditBar}
      onSubmit={handleSubmit(onSubmit)}
      aria-labelledby="bulk-edit-bar-label"
      style={{ backgroundColor: "white" }}
    >
      <span className={styles.label} id="bulk-edit-bar-label">{selectedCount} seleccionados</span>
      <label htmlFor="bulk-edit-price" className="sr-only">Nuevo precio</label>
      <input
        id="bulk-edit-price"
        className={`${styles.input} ${errors.price ? styles.inputError : ''}`}
        type="number"
        min="0"
        step="0.01"
        placeholder="Nuevo precio"
        aria-label="Nuevo precio"
        disabled={loading}
        {...register('price')}
      />
      {errors.price && <span className={styles.errorMsg}>{errors.price.message}</span>}
      <label htmlFor="bulk-edit-stock" className="sr-only">Nuevo stock</label>
      <input
        id="bulk-edit-stock"
        className={`${styles.input} ${errors.stock ? styles.inputError : ''}`}
        type="number"
        min="0"
        step="1"
        placeholder="Nuevo stock"
        aria-label="Nuevo stock"
        disabled={loading}
        {...register('stock')}
      />
      {errors.stock && <span className={styles.errorMsg}>{errors.stock.message}</span>}
      <label htmlFor="bulk-edit-instock" className="sr-only">Estado</label>
      <select
        id="bulk-edit-instock"
        className={styles.input}
        aria-label="Estado"
        disabled={loading}
        {...register('inStock')}
      >
        <option value="">Elija un estado</option>
        <option value="true">Activo</option>
        <option value="false">Inactivo</option>
      </select>
      <div className={styles.actions}>
        <button type="submit" className={styles.applyBtn} disabled={loading || !isValid || isSubmitting} aria-label="Aplicar cambios masivos">
          Aplicar cambios
        </button>
        <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={loading} aria-label="Cancelar edición masiva">
          Cancelar
        </button>
      </div>
    </form>
  );
};
