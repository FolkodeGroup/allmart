import React from 'react';
import sectionStyles from '../../features/admin/shared/AdminSection.module.css';
import styles from '../../features/admin/products/AdminProducts.module.css';

interface ProductHeaderProps {
  canCreate: boolean;
  onNew: () => void;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({ canCreate, onNew }) => (
  <header className={sectionStyles.header}>
    <div className={styles.headerTop}>
      <div>
        <span className={sectionStyles.label} id="admin-label">Administración</span>
        <h1 className={sectionStyles.title} aria-labelledby="admin-label">
          <span className={sectionStyles.icon} aria-hidden="true">📦</span> Productos
        </h1>
        <p className={sectionStyles.subtitle}>
          Gestioná el catálogo de productos, precios y disponibilidad.
        </p>
      </div>
      {canCreate && (
        <button className={styles.newBtn} onClick={onNew} aria-label="Crear nuevo producto">
          + Nuevo producto
        </button>
      )}
    </div>
  </header>
);
