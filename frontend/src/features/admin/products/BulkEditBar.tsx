import React, { useState } from 'react';
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
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [inStock, setInStock] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let priceVal: number | undefined = price ? Number(price) : undefined;
    let stockVal: number | undefined = stock ? Number(stock) : undefined;
    let inStockVal: boolean | undefined = inStock ? inStock === 'true' : undefined;
    if (price && (isNaN(priceVal!) || priceVal! < 0)) {
      setError('El precio debe ser un número mayor o igual a 0.');
      return;
    }
    if (stock && (isNaN(stockVal!) || stockVal! < 0)) {
      setError('El stock debe ser un número mayor o igual a 0.');
      return;
    }
    onBulkEdit({ price: priceVal, stock: stockVal, inStock: inStockVal });
  };

  return (
    <form
      className={styles.bulkEditBar}
      onSubmit={handleSubmit}
      role="form"
      aria-labelledby="bulk-edit-bar-label"
    >
      <span className={styles.label} id="bulk-edit-bar-label">{selectedCount} seleccionados</span>
      <label htmlFor="bulk-edit-price" className="sr-only">Nuevo precio</label>
      <input
        id="bulk-edit-price"
        className={styles.input}
        type="number"
        min="0"
        step="0.01"
        placeholder="Nuevo precio"
        value={price}
        onChange={e => setPrice(e.target.value)}
        disabled={loading}
        aria-label="Nuevo precio"
      />
      <label htmlFor="bulk-edit-stock" className="sr-only">Nuevo stock</label>
      <input
        id="bulk-edit-stock"
        className={styles.input}
        type="number"
        min="0"
        step="1"
        placeholder="Nuevo stock"
        value={stock}
        onChange={e => setStock(e.target.value)}
        disabled={loading}
        aria-label="Nuevo stock"
      />
      <label htmlFor="bulk-edit-instock" className="sr-only">Estado</label>
      <select
        id="bulk-edit-instock"
        className={styles.input}
        value={inStock}
        onChange={e => setInStock(e.target.value)}
        disabled={loading}
        aria-label="Estado"
      >
        <option value="">Estado</option>
        <option value="true">Activo</option>
        <option value="false">Inactivo</option>
      </select>
      <button className={styles.applyBtn} type="submit" disabled={loading} aria-label="Aplicar cambios masivos">
        Aplicar cambios
      </button>
      <button className={styles.cancelBtn} type="button" onClick={onCancel} disabled={loading} aria-label="Cancelar edición masiva">
        Cancelar
      </button>
      {error && <span className={styles.error} aria-live="polite">{error}</span>}
    </form>
  );
};
