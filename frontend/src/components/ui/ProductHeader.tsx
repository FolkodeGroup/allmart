import React from 'react';
import { Plus } from 'lucide-react';
import sectionStyles from '../../features/admin/shared/AdminSection.module.css';
import styles from './ProductHeader.module.css';
import { ExportButtons } from './ExportButtons';
import type { ExportFormat } from './ExportButtons';

interface ProductHeaderProps {
  canCreate: boolean;
  onNew: () => void;
  /** Callback para exportar el catálogo en CSV */
  onExportCSV?: () => void;
  /** Callback para exportar el catálogo en Excel */
  onExportExcel?: () => void | Promise<void>;
  /** Callback para exportar el catálogo en PDF */
  onExportPdf?: () => void | Promise<void>;
  /** Formato actualmente exportando */
  exportLoadingFormat?: ExportFormat | null;
  /** @deprecated usar exportLoadingFormat */
  isExportingPdf?: boolean;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({
  canCreate,
  onNew,
  onExportCSV,
  onExportExcel,
  onExportPdf,
  exportLoadingFormat = null,
}) => {
  const showExport = onExportCSV || onExportExcel || onExportPdf;

  return (
    <header className={sectionStyles.header}>
      <div className={styles.headerRow}>
        <p className={sectionStyles.subtitle}>
          Gestioná el catálogo de productos, precios y disponibilidad.
        </p>

        <div className={styles.btnContainer}>
          {showExport && (
            <ExportButtons
              onExportCSV={onExportCSV}
              onExportExcel={onExportExcel}
              onExportPDF={onExportPdf}
              loading={exportLoadingFormat}
            />
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
