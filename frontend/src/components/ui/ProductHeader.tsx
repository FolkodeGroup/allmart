import React from 'react';
import { Plus } from 'lucide-react';
import sectionStyles from '../../features/admin/shared/AdminSection.module.css';
import styles from './ProductHeader.module.css';

interface ProductHeaderProps {
  canCreate: boolean;
  onNew: () => void;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({
  canCreate,
  onNew,
}) => {

  return (
    <header className={sectionStyles.header}>
      <div className={styles.headerRow}>
        <p className={sectionStyles.subtitle}>
          Gestioná el catálogo de productos, precios y disponibilidad.
        </p>

        <div className={styles.btnContainer}>
          {canCreate && (
            <button
              className={styles.primaryBtn}
              onClick={() => { onNew(); }}
              aria-label="Crear nuevo producto con formulario completo"
            >
              <Plus size={16} strokeWidth={2.5} />
              Nuevo producto
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
