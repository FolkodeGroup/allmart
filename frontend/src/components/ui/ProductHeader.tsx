import React from 'react';
import { Plus, FileDown, Loader2 } from 'lucide-react';
import sectionStyles from '../../features/admin/shared/AdminSection.module.css';
import styles from './ProductHeader.module.css';

interface ProductHeaderProps {
  canCreate: boolean;
  onNew: () => void;
  /** Callback para exportar el catálogo en PDF */
  onExportPdf?: () => void;
  /** Indica si la exportación está en progreso */
  isExportingPdf?: boolean;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({
  canCreate,
  onNew,
  onExportPdf,
  isExportingPdf = false,
}) => {
  return (
    <header className={sectionStyles.header}>
      <div className={styles.headerRow}>
        <p className={sectionStyles.subtitle}>
          Gestioná el catálogo de productos, precios y disponibilidad.
        </p>

        <div className={styles.btnContainer}>
          {onExportPdf && (
            <button
              className={styles.exportBtn}
              onClick={onExportPdf}
              disabled={isExportingPdf}
              aria-label="Exportar catálogo de productos en PDF"
              title="Exportar catálogo PDF con los filtros activos"
            >
              {isExportingPdf ? (
                <Loader2 size={15} strokeWidth={2} className={styles.spinIcon} />
              ) : (
                <FileDown size={15} strokeWidth={2} />
              )}
              {isExportingPdf ? 'Generando…' : 'Exportar PDF'}
            </button>
          )}

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
