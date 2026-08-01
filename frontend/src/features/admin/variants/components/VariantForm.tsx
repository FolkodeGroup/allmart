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
  };

  return (
    <div className={styles.addGroupSection}>
      <style>{`
        @media (max-width: 639px) {
          .variantFormRowResponsive {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .variantFormInputResponsive {
            width: 100% !important;
            min-height: 44px !important;
          }
          .variantFormBtnResponsive {
            width: 100% !important;
            min-height: 44px !important;
            justify-content: center !important;
            display: flex !important;
            align-items: center !important;
          }
        }
      `}</style>
      <div className={`${styles.addGroupRow} variantFormRowResponsive`}>
        <input
          className={`${styles.groupInput} ${error ? styles.inputError : ''} variantFormInputResponsive`}
          type="text"
          placeholder="Nombre del grupo, ej: Color, Tamaño, Material..."
          value={newGroupName}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <Tooltip title="Crear un nuevo grupo de variantes para este producto (ej: Color, Tamaño, Material)" placement="top" arrow>
          <button className={`${styles.addGroupBtn} variantFormBtnResponsive`} onClick={onAddGroup} type="button">
            + Agregar grupo
          </button>
        </Tooltip>
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};