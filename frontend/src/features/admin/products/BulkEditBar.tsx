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
    <form className={styles.bulkEditBar} onSubmit={handleSubmit}>
      <span className={styles.label}>{selectedCount} seleccionados</span>
      <input
        className={styles.input}
        type="number"
        min="0"
        step="0.01"
        placeholder="Nuevo precio"
        value={price}
        onChange={e => setPrice(e.target.value)}
        disabled={loading}
      />
      <input
        className={styles.input}
        type="number"
        min="0"
        step="1"
        placeholder="Nuevo stock"
        value={stock}
        onChange={e => setStock(e.target.value)}
        disabled={loading}
      />
      <select
        className={styles.input}
        value={inStock}
        onChange={e => setInStock(e.target.value)}
        disabled={loading}
      >
        <option value="">Estado</option>
        <option value="true">Activo</option>
        <option value="false">Inactivo</option>
      </select>
      <button className={styles.applyBtn} type="submit" disabled={loading}>
        Aplicar cambios
      </button>
      <button className={styles.cancelBtn} type="button" onClick={onCancel} disabled={loading}>
        Cancelar
      </button>
      {error && <span className={styles.error}>{error}</span>}
    </form>
  );
};
