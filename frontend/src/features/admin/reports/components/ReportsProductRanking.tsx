import { type KeyboardEvent } from 'react';
import styles from '../AdminReports.module.css';

type Product = {
    id: string;
    name: string;
    qty: number;
    revenue: number;
    productImage?: string;
};

interface ProductRankingProps {
    products: Product[];
    maxRevenue: number;
    formatPrice: (n: number) => string;
    onProductSelect?: (product: Product) => void;
}
export function ProductRanking({
    products,
    maxRevenue,
    formatPrice,
    onProductSelect,
}: ProductRankingProps) {
    if (!products.length) {
        return <p className={styles.noData}>Sin datos en este período.</p>;
    }

    const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, product: Product) => {
        if (!onProductSelect) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onProductSelect(product);
        }
    };

    return (
        <div className={styles.tableResponsive}>
            <table className={styles.table} aria-label="Ranking de productos más vendidos">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Imagen</th>
                        <th>Producto</th>
                        <th>Ventas</th>
                        <th>Ingresos</th>
                    </tr>
                </thead>
                <tbody>
                    {products.slice(0, 10).map((product, i) => (
                        <tr
                            key={product.id}
                            className={onProductSelect ? styles.clickableRow : undefined}
                            onClick={() => onProductSelect?.(product)}
                            onKeyDown={(event) => handleRowKeyDown(event, product)}
                            tabIndex={onProductSelect ? 0 : -1}
                            role={onProductSelect ? 'button' : undefined}
                            aria-label={onProductSelect ? `Ver historial de precios de ${product.name}` : undefined}
                        >
                            <td>
                                <span className={styles.rankBadgeModern}>#{i + 1}</span>
                            </td>
                            <td>
                                {product.productImage ? (
                                    <img
                                        src={product.productImage}
                                        alt={product.name}
                                        className={styles.productImage}
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className={styles.productImagePlaceholder} aria-hidden="true">📦</div>
                                )}
                            </td>
                            <td>
                                <span className={styles.productNameModern}>{product.name}</span>
                            </td>
                            <td>
                                <span className={styles.statModernUnit}>{product.qty} und.</span>
                            </td>
                            <td>
                                <span className={styles.statModernValue}>{formatPrice(product.revenue)}</span>
                                <div
                                    className={styles.progressBarModern}
                                    aria-label={`Ingresos relativos: ${Math.max((product.revenue / maxRevenue) * 100, 4).toFixed(0)}%`}
                                >
                                    <div
                                        className={styles.progressFillModern}
                                        style={{ width: `${Math.max((product.revenue / maxRevenue) * 100, 4)}%` }}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}