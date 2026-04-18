/**
 * Componente para mostrar validación inline con características avanzadas
 * Soporta validación en tiempo real, sugerencias y helpers
 */
import type { FC, ReactNode } from 'react';
import styles from '../AdminProductFormPage.module.css';

export interface ValidationHelperProps {
  error?: string;
  hint?: string;
  success?: boolean;
  warning?: string;
  suggestion?: ReactNode;
  showProgress?: boolean;
  progressValue?: number;
  progressLabel?: string;
  className?: string;
}

/**
 * Componente para mostrar validación inline mejorada
 */
export const ValidationHelper: FC<ValidationHelperProps> = ({
  error,
  hint,
  success,
  warning,
  suggestion,
  showProgress = false,
  progressValue = 0,
  progressLabel,
  className = '',
}) => {
  return (
    <div className={`${className}`}>
      {error && (
        <div className={styles.errorText} role="alert">
          ❌ {error}
        </div>
      )}

      {warning && (
        <div className={styles.warningText} role="alert">
          ⚠️ {warning}
        </div>
      )}

      {success && (
        <div className={styles.successText} role="status">
          ✓ {typeof success === 'string' ? success : 'Válido'}
        </div>
      )}

      {hint && !error && (
        <div className={styles.fieldHint}>
          ℹ️ {hint}
        </div>
      )}

      {suggestion && (
        <div className={styles.suggestionBox}>
          {suggestion}
        </div>
      )}

      {showProgress && (
        <div className={styles.progressContainer}>
          <div className={styles.progressLabel}>
            {progressLabel || 'Progreso'}
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.min(progressValue, 100)}%` }}
            />
          </div>
          <div className={styles.progressText}>
            {progressValue}%
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Componente para mostrar sugerencia de SKU
 */
export interface SkuSuggestionProps {
  suggestedSku: string;
  onAccept: (sku: string) => void;
  onReject?: () => void;
}

export const SkuSuggestion: FC<SkuSuggestionProps> = ({
  suggestedSku,
  onAccept,
  onReject,
}) => {
  return (
    <div className={styles.suggestionBox}>
      <div style={{ marginBottom: '8px' }}>
        <strong>SKU sugerido:</strong> <code>{suggestedSku}</code>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => onAccept(suggestedSku)}
          title="Aceptar SKU sugerido"
        >
          ✓ Usar
        </button>
        {onReject && (
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onReject}
            title="Rechazar y usar manual"
            style={{ fontSize: '0.85rem', padding: '4px 8px' }}
          >
            ✕ No
          </button>
        )}
      </div>
    </div>
  );
};

export const SlugPreview: FC<{ slug: string; originalName: string }> = ({
  slug,
  originalName,
}) => {
  return (
    <div className={styles.fieldHint}>
      <strong>Vista previa del slug:</strong>{' '}
      <code>/{slug || originalName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}</code>
    </div>
  );
};
