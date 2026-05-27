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

const CSV_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const EXCEL_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18" />
  </svg>
);

const PDF_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 13h1a1 1 0 0 1 0 2H9v-2z" />
    <path d="M9 13v4" />
    <path d="M13 13v4" />
    <path d="M13 15h2" />
    <path d="M17 13v4" />
    <path d="M17 13a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1" />
  </svg>
);

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
    { format: 'csv',  label: 'CSV',   ariaLabel: 'Exportar como CSV',   icon: CSV_ICON   },
    { format: 'xlsx', label: 'Excel', ariaLabel: 'Exportar como Excel', icon: EXCEL_ICON },
    { format: 'pdf',  label: 'PDF',   ariaLabel: 'Exportar como PDF',   icon: PDF_ICON   },
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
