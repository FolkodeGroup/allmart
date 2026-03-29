
import styles from '../AdminReports.module.css';

type Products = {
    id: string;
    name: string;
    qty: number;
    revenue: number;
    imageUrl?: string; // Optional: for future extensibility
};

interface ProductReportCardProps {
    product: Products;
    position: number;
    maxRevenue: number;
    formatPrice: (n: number) => string;
}

export function ProductRankingList({
    product,
    position,
    maxRevenue,
    formatPrice
}: ProductReportCardProps) {

    const percentage = Math.max((product.revenue / maxRevenue) * 100, 4);

    return (
        <div className={styles.reportCardModern} tabIndex={0} aria-label={`Producto #${position}: ${product.name}`}>
            <div className={styles.reportCardModernHeader}>
                <span className={styles.rankBadgeModern}>#{position}</span>
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className={styles.productImage}
                        loading="lazy"
                    />
                ) : (
                    <div className={styles.productImagePlaceholder} aria-hidden="true">📦</div>
                )}
                <span className={styles.productNameModern}>{product.name}</span>
            </div>
            <div className={styles.reportCardModernStats}>
                <div className={styles.statModernBlock}>
                    <span className={styles.statModernLabel}>Ventas</span>
                    <span className={styles.statModernValue}>{product.qty} und.</span>
                </div>
                <div className={styles.statModernBlock}>
                    <span className={styles.statModernLabel}>Ingresos</span>
                    <span className={styles.statModernValue}>{formatPrice(product.revenue)}</span>
                </div>
            </div>
            <div className={styles.progressBarModern} aria-label={`Ingresos relativos: ${percentage.toFixed(0)}%`}>
                <div
                    className={styles.progressFillModern}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}