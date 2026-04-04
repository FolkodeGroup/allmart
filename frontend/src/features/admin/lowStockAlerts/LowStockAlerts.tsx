/**
 * frontend/src/features/admin/lowStockAlerts/LowStockAlerts.tsx
 * Componente para mostrar alertas de stock bajo
 */

import React, { useState, useEffect } from 'react';
import styles from './LowStockAlerts.module.css';
import {
  getCurrentLowStockProducts,
  type CurrentLowStockProductsResponse,
} from './services/lowStockAlertsService';

export const LowStockAlerts: React.FC = () => {
  const [stockSnapshot, setStockSnapshot] = useState<CurrentLowStockProductsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;
  const threshold = 5;

  const loadCurrentStock = async (page = 1) => {
    setLoading(true);
    try {
      const data = await getCurrentLowStockProducts(page, limit, threshold);
      setStockSnapshot(data);
      setCurrentPage(data.page);
    } catch (error) {
      console.error('Error loading low stock products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentStock(1);
  }, []);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadCurrentStock(currentPage);
    }, 30000);

    return () => clearInterval(interval);
  }, [currentPage]);

  if (!stockSnapshot) {
    return <div className={styles.loading}>Cargando alertas...</div>;
  }

  const productsData = Array.isArray(stockSnapshot.data) ? stockSnapshot.data : [];
  const noStockCount =
    typeof stockSnapshot.summary?.noStock === 'number'
      ? stockSnapshot.summary.noStock
      : productsData.filter((product) => product.stock <= 0).length;
  const lowStockCount =
    typeof stockSnapshot.summary?.lowStock === 'number'
      ? stockSnapshot.summary.lowStock
      : productsData.filter((product) => product.stock > 0 && product.stock <= threshold).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>⚠️ Alertas de Stock Bajo</h2>
        <div className={styles.badge}>
          {noStockCount} sin stock · {lowStockCount} bajo stock
        </div>
      </div>

      {productsData.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay productos con stock bajo o sin stock.</p>
        </div>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>SKU</th>
                <th>Stock actual</th>
                <th>Nivel</th>
                <th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {productsData.map((product) => (
                <tr key={product.id} className={product.alertLevel === 'no_stock' ? styles.critical : styles.warning}>
                  <td className={styles.productName}>{product.name}</td>
                  <td>{product.category?.name ?? 'Sin categoría'}</td>
                  <td>{product.sku || 'Sin SKU'}</td>
                  <td className={styles.number + ' ' + (product.stock <= 0 ? styles.negative : '')}>
                    {product.stock}
                  </td>
                  <td>{product.alertLevel === 'no_stock' ? 'Sin stock' : `Stock bajo (<= ${stockSnapshot.summary.threshold})`}</td>
                  <td className={styles.date}>
                    {new Date(product.updatedAt).toLocaleString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación */}
          {stockSnapshot.pages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => loadCurrentStock(1)}
                disabled={currentPage === 1 || loading}
              >
                Primera
              </button>
              <button
                className={styles.pageBtn}
                onClick={() => loadCurrentStock(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                Anterior
              </button>

              <span className={styles.pageInfo}>
                Página {stockSnapshot.page} de {stockSnapshot.pages}
              </span>

              <button
                className={styles.pageBtn}
                onClick={() => loadCurrentStock(currentPage + 1)}
                disabled={currentPage === stockSnapshot.pages || loading}
              >
                Siguiente
              </button>
              <button
                className={styles.pageBtn}
                onClick={() => loadCurrentStock(stockSnapshot.pages)}
                disabled={currentPage === stockSnapshot.pages || loading}
              >
                Última
              </button>
            </div>
          )}
        </>
      )}

      <button className={styles.refreshBtn} onClick={() => loadCurrentStock(1)} disabled={loading}>
        {loading ? '🔄 Actualizando...' : '🔄 Actualizar'}
      </button>
    </div>
  );
};

export default LowStockAlerts;
