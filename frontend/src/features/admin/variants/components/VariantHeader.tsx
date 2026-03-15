import React from 'react';
import type { AdminProduct } from '../../../../context/AdminProductsContext';
import styles from '../AdminVariants.module.css';

interface VariantHeaderProps {
  selectedProduct: AdminProduct;
  groupCount: number;
}

/**
 * VariantHeader - Muestra el header del panel de gestión de variantes.
 *
 * Responsabilidades:
 * - Mostrar nombre y SKU del producto seleccionado.
 * - Mostrar conteo de grupos de variantes.
 */
export const VariantHeader: React.FC<VariantHeaderProps> = ({
  selectedProduct,
  groupCount,
}) => (
  <div className={styles.contentHeader}>
    <div>
      <h2 className={styles.contentTitle}>{selectedProduct.name}</h2>
      {selectedProduct.sku && (
        <span className={styles.contentSku}>SKU: {selectedProduct.sku}</span>
      )}
    </div>
    <span className={styles.groupCount}>
      {groupCount} grupo{groupCount !== 1 ? 's' : ''}
    </span>
  </div>
);