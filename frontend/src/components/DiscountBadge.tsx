/**
 * components/DiscountBadge.tsx
 * Componente para mostrar badges de descuento en productos.
 */

import React from 'react';
import styles from './DiscountBadge.module.css';

interface Props {
  discountPercentage?: number;
  originalPrice?: number;
  finalPrice?: number;
  promotionType?: string;
}

const DiscountBadge: React.FC<Props> = ({
  discountPercentage,
  originalPrice,
  finalPrice,
  promotionType,
}) => {
  if (!discountPercentage || discountPercentage <= 0) {
    return null;
  }

  let badgeText = '';
  if (promotionType === 'bogo') {
    badgeText = 'BOGO';
  } else if (promotionType === 'percentage') {
    badgeText = `-${Math.round(discountPercentage)}%`;
  } else if (promotionType === 'fixed' && originalPrice && finalPrice) {
    badgeText = `-$${(originalPrice - finalPrice).toFixed(2)}`;
  } else {
    badgeText = 'EN OFERTA';
  }

  return (
    <div className={styles.badge}>
      <span className={styles.badgeText}>{badgeText}</span>
    </div>
  );
};

export default DiscountBadge;
