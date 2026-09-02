import React from 'react';
import styles from './AddToCartToast.module.css';
import { Check, CheckCircle2 } from 'lucide-react';

interface AddToCartToastProps {
  productName: string;
  imageUrl?: string | null;
  quantity?: number;
}

export const AddToCartToast: React.FC<AddToCartToastProps> = ({ productName, imageUrl, quantity = 1 }) => {
  return (
    <div className={styles.toastContainer} role="status" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.iconBox} aria-hidden>
          {imageUrl ? (
             
            <img src={imageUrl} alt={productName} className={styles.thumb} />
          ) : (
            <Check size={20} />
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} color="#16a34a" />
            <span className={styles.title}>¡Se ha agregado al carrito exitosamente!</span>
          </div>
          <span className={styles.subtitle}>{productName}{quantity > 1 ? ` · x${quantity}` : ''}</span>
        </div>
      </div>
    </div>
  );
};

export default AddToCartToast;
