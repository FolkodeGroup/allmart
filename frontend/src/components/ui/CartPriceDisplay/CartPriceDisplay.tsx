import React from 'react';
import type { Discount } from '../../../types';
import styles from './CartPriceDisplay.module.css';

interface CartPriceDisplayProps {
    originalPrice: number;
    discount?: Discount | null;
    quantity?: number;
    showDiscountBadge?: boolean;
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
    }).format(price);
}

/**
 * CartPriceDisplay — Muestra el precio con descuento aplicado.
 * Soporta descuentos de porcentaje (%), monto fijo ($) y BOGO.
 * Muestra el precio original tachado y el precio con descuento en color destacado.
 */
export const CartPriceDisplay: React.FC<CartPriceDisplayProps> = ({
    originalPrice,
    discount,
    quantity = 1,
    showDiscountBadge = true,
}) => {
    if (!discount) {
        return (
            <div className={styles.priceContainer}>
                <span className={styles.price}>{formatPrice(originalPrice * quantity)}</span>
            </div>
        );
    }

    const finalUnitPrice = discount.finalPrice;
    const finalPrice = finalUnitPrice * quantity;
    const discountAmount = discount.discountAmount * quantity;

    // Determinar si mostrar precio original tachado
    // Solo mostrar tachado para descuentos "percentage" o "fixed", NO para "bogo"
    const shouldShowStrikethrough =
        discount.promotionType === 'percentage' || discount.promotionType === 'fixed';

    return (
        <div className={styles.priceContainer}>
            {/* Precio original tachado (solo para descuentos percentage o fixed) */}
            {shouldShowStrikethrough && (
                <span className={styles.originalPrice}>
                    {formatPrice(originalPrice * quantity)}
                    {/* Badge de descuento */}
                    {showDiscountBadge && (
                        <span className={styles.discountBadge}>
                            -{discount.discountPercentage.toFixed(0)}%
                        </span>
                    )}
                </span>
            )}

            {/* Precio con descuento */}
            <span className={styles.discountedPrice}>
                {formatPrice(finalPrice)}
            </span>



            {/* Información adicional del descuento */}
            <div className={styles.discountInfo}>
                <span className={styles.promoName}>{discount.promotionName}</span>
                <span className={styles.savingAmount}>
                    Ahorras {formatPrice(discountAmount)}
                </span>
            </div>
        </div>
    );
};
