import styles from '../AdminReports.module.css';

type Product = {
    id: string;
    name: string;
    qty: number;
    revenue: number;
    imageUrl?: string;
};

interface ProductRankingProps {
    products: Product[];
    maxRevenue: number;
    formatPrice: (n: number) => string;
    viewMode: 'list' | 'cards';
}

export function ProductRanking({
    products,
    maxRevenue,
    formatPrice,
    viewMode
}: ProductRankingProps) {
    if (!products.length) {
        return <p className={styles.noData}>Sin datos en este período.</p>;
    }

    // Ejemplo de uso de viewMode:
    if (viewMode === 'cards') {
        return (
            <div className={styles.cardsContainer}>
                {products.slice(0, 10).map((product, i) => (
                    <div key={product.id} className={styles.productCard}>
                        <div className={styles.rankBadgeModern}>#{i + 1}</div>
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
                        <div className={styles.productNameModern}>{product.name}</div>
                        <div className={styles.statModernValue}>{product.qty} und.</div>
                        <div className={styles.statModernValue}>{formatPrice(product.revenue)}</div>
                        <div className={styles.progressBarModern} aria-label={`Ingresos relativos: ${Math.max((product.revenue / maxRevenue) * 100, 4).toFixed(0)}%`}>
                            <div
                                className={styles.progressFillModern}
                                style={{ width: `${Math.max((product.revenue / maxRevenue) * 100, 4)}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    // Vista por defecto: lista (tabla)
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
                        <tr key={product.id}>
                            <td>
                                <span className={styles.rankBadgeModern}>#{i + 1}</span>
                            </td>
                            <td>
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
                            </td>
                            <td>
                                <span className={styles.productNameModern}>{product.name}</span>
                            </td>
                            <td>
                                <span className={styles.statModernValue}>{product.qty} und.</span>
                            </td>
                            <td>
                                <span className={styles.statModernValue}>{formatPrice(product.revenue)}</span>
                                {/* Barra de progreso de ingresos relativa */}
                                <div className={styles.progressBarModern} aria-label={`Ingresos relativos: ${Math.max((product.revenue / maxRevenue) * 100, 4).toFixed(0)}%`}>
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