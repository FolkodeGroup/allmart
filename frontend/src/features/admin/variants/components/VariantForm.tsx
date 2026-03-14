import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import styles from '../AdminVariants.module.css';

interface VariantFormProps {
  newGroupName: string;
  setNewGroupName: (name: string) => void;
  onAddGroup: () => void;
  error: string;
  canCreate: boolean;
}

/**
 * VariantForm - Formulario para crear nuevos grupos de variantes.
 *
 * Responsabilidades:
 * - Input para nombre del grupo.
 * - Botón para agregar grupo.
 * - Manejo de errores de validación.
 */
export const VariantForm: React.FC<VariantFormProps> = ({
  newGroupName,
  setNewGroupName,
  onAddGroup,
  error,
  canCreate,
}) => {
  if (!canCreate) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onAddGroup();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewGroupName(e.target.value);
    // Limpiar error al cambiar
    if (error) setNewGroupName(e.target.value); // Esto debería limpiar el error en el padre
  };

  return (
    <div className={styles.addGroupSection}>
      <div className={styles.addGroupRow}>
        <input
          className={`${styles.groupInput} ${error ? styles.inputError : ''}`}
          type="text"
          placeholder="Nombre del grupo, ej: Color, Tamaño, Material..."
          value={newGroupName}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <Tooltip title="Crear un nuevo grupo de variantes para este producto (ej: Color, Tamaño, Material)" placement="top" arrow>
          <button className={styles.addGroupBtn} onClick={onAddGroup} type="button">
            + Agregar grupo
          </button>
        </Tooltip>
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};