/**
 * ExportButtons — Componente unificado de exportación.
 * Muestra 3 botones: CSV, Excel y PDF alineados con el branding de Allmart.
 * Soporta modo oscuro/claro via tokens CSS.
 */
import React from 'react';
import { Loader2 } from 'lucide-react';
import styles from './ExportButtons.module.css';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

interface ExportButtonsProps {
  /** Callback al presionar CSV */
  onExportCSV?: () => void | Promise<void>;
  /** Callback al presionar Excel */
  onExportExcel?: () => void | Promise<void>;
  /** Callback al presionar PDF */
  onExportPDF?: () => void | Promise<void>;
  /** Formato actualmente exportando (muestra loader en ese botón) */
  loading?: ExportFormat | null;
  /** Deshabilitar todos los botones */
  disabled?: boolean;
  /** Ocultar un formato específico */
  hide?: ExportFormat[];
  /** Clase CSS extra para el contenedor */
  className?: string;
}

interface FormatConfig {
  format: ExportFormat;
  label: string;
  ariaLabel: string;
  icon: React.ReactNode;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  onExportCSV,
  onExportExcel,
  onExportPDF,
  loading = null,
  disabled = false,
  hide = [],
  className,
}) => {
  const formats: FormatConfig[] = [
    { 
      format: 'csv',  
      label: 'CSV',   
      ariaLabel: 'Exportar como CSV',   
      icon: <i className="bi bi-filetype-csv" aria-hidden="true" /> 
    },
    { 
      format: 'xlsx', 
      label: 'Excel', 
      ariaLabel: 'Exportar como Excel', 
      icon: <i className="bi bi-filetype-xlsx" aria-hidden="true" /> 
    },
    { 
      format: 'pdf',  
      label: 'PDF',   
      ariaLabel: 'Exportar como PDF',   
      icon: <i className="bi bi-file-earmark-pdf-fill" aria-hidden="true" /> 
    },
  ];

  const callbacks: Record<ExportFormat, (() => void | Promise<void>) | undefined> = {
    csv:  onExportCSV,
    xlsx: onExportExcel,
    pdf:  onExportPDF,
  };

  const visibleFormats = formats.filter(f => !hide.includes(f.format));

  return (
    <div className={[styles.exportGroup, className].filter(Boolean).join(' ')} role="group" aria-label="Opciones de exportación">
      {visibleFormats.map(({ format, label, ariaLabel, icon }) => {
        const isLoading = loading === format;
        const cb = callbacks[format];
        const isDisabled = disabled || !!loading || !cb;

        return (
          <button
            key={format}
            type="button"
            className={[styles.exportBtn, styles[`exportBtn--${format}`]].join(' ')}
            onClick={() => cb?.()}
            disabled={isDisabled}
            aria-label={ariaLabel}
            aria-busy={isLoading}
            title={ariaLabel}
            style={{ fontSize: '1rem' }} // Asegura buen tamaño para el icono bi
          >
            {isLoading ? (
              <Loader2 size={13} strokeWidth={2.5} className={styles.spinner} aria-hidden="true" />
            ) : (
              icon
            )}
            <span className={styles.btnLabel}>{isLoading ? 'Exportando…' : label}</span>
          </button>
        );
      })}
    </div>
  );
};