import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import styles from '../AdminVariants.module.css';

interface VariantValueChipProps {
  value: string;
  onRemove: () => void;
  canDelete: boolean;
}

/**
 * VariantValueChip - Chip que representa un valor de variante.
 *
 * Responsabilidades:
 * - Mostrar el valor como chip.
 * - Botón para eliminar el valor (si tiene permisos).
 */
export const VariantValueChip: React.FC<VariantValueChipProps> = ({
  value,
  onRemove,
  canDelete,
}) => (
  <span className={styles.valueChip}>
    {value}
    {canDelete && (
      <Tooltip title={`Eliminar el valor "${value}" de este grupo`} placement="top" arrow>
        <button
          type="button"
          className={styles.chipRemove}
          onClick={onRemove}
        >
          ×
        </button>
      </Tooltip>
    )}
  </span>
);