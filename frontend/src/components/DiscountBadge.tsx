/**
 * components/DiscountBadge.tsx
 * Componente para mostrar badges de descuento en productos.
 */

import React from 'react';
import styles from './DiscountBadge.module.css';

interface Props {
  discountPercentage?: number;
  discountAmount?: number;
  promotionType?: 'percentage' | 'fixed' | 'bogo' | string;
  display?: 'overlay' | 'inline';
}

const DiscountBadge: React.FC<Props> = ({
  discountPercentage,
  discountAmount,
  promotionType,
  display = 'overlay',
}) => {
  let badgeText = '';
  if (promotionType === 'bogo') {
    badgeText = 'BOGO';
  } else if (promotionType === 'percentage' && discountPercentage && discountPercentage > 0) {
    badgeText = `-${Math.round(discountPercentage)}%`;
  } else if (promotionType === 'fixed' && discountAmount && discountAmount > 0) {
    badgeText = `-$${discountAmount.toFixed(0)}`;
  } else {
    return null;
  }

  const className = display === 'inline' ? styles.inlineBadge : styles.badge;

  return (
    <div className={className} data-promotion-type={promotionType}>
      <span className={styles.badgeText}>{badgeText}</span>
    </div>
  );
};

export default DiscountBadge;
