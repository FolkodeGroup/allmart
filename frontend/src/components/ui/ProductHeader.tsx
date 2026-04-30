import React from 'react';
import { Plus, Zap } from 'lucide-react';
import sectionStyles from '../../features/admin/shared/AdminSection.module.css';
import styles from './ProductHeader.module.css';

interface ProductHeaderProps {
  canCreate: boolean;
  onNew: () => void;
  onWizard?: () => void;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({ canCreate, onNew, onWizard }) => {
  return (
    <header className={sectionStyles.header}>
      <div className={styles.headerRow}>
        <p className={sectionStyles.subtitle}>
          Gestioná el catálogo de productos, precios y disponibilidad.
        </p>

        {canCreate && (
          <div className={styles.btnContainer}>
            <button
              className={styles.primaryBtn}
              onClick={() => { onNew(); }}
              aria-label="Crear nuevo producto con formulario completo"
            >
              <Plus size={16} strokeWidth={2.5} />
              Nuevo producto
            </button>

            {onWizard && (
              <button
                className={styles.wizardBtn}
                onClick={() => { onWizard(); }}
                aria-label="Crear nuevo producto con alta rápida"
                title="3 pasos guiados para crear un producto rápidamente"
              >
                <Zap size={16} strokeWidth={2.5} />
                Alta rápida
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
