import React from 'react';
import { Tooltip } from './Tooltip';
import styles from '../../features/admin/products/AdminProductCard.module.css';

interface ProductCardCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export const ProductCardCheckbox: React.FC<ProductCardCheckboxProps> = ({ checked, onChange, label }) => (
  <Tooltip content="Seleccionar producto">
    <div className={styles.checkboxWrapper}>
      <label>
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          aria-checked={checked}
          aria-label={label}
          tabIndex={0}
        />
        <span className="sr-only">{label}</span>
      </label>
    </div>
  </Tooltip>
);
