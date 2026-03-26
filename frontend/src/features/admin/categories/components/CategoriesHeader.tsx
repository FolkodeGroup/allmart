import React from 'react';
import sectionStyles from '../../shared/AdminSection.module.css';
import styles from '../AdminCategories.module.css';

interface CategoriesHeaderProps {
  canCreate: boolean;
  onNew: () => void;
}

export const CategoriesHeader: React.FC<CategoriesHeaderProps> = ({ canCreate, onNew }) => (
  <div className={sectionStyles.header}>
    <div className={styles.headerTop}>
      <div>
        <span className={sectionStyles.label}>Administración</span>
        <h1 className={sectionStyles.title}>
          <span className={sectionStyles.icon}>📁</span> Categorías
        </h1>
        <p className={sectionStyles.subtitle}>
          Gestioná las categorías del catálogo para organizar tus productos.
        </p>
      </div>
      {canCreate && (
        <button className={styles.newBtn} onClick={onNew}>
          + Nueva categoría
        </button>
      )}
    </div>
  </div>
);
