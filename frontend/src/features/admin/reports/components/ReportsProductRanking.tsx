import styles from '../AdminReports.module.css';
import { ProductRankingList } from './ReportProductRankingList';
import { ProductReportCard } from './ReportCardProduct';

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
    viewMode?: 'list' | 'cards'; // Nueva prop para alternar vista, por ahora no se usa pero puede ser útil para futuras mejoras
}

export function ProductRanking({
    products,
    maxRevenue,
    formatPrice,
    viewMode = 'list' // Valor por defecto
}: ProductRankingProps) {
    if (products.length === 0) {
        return <p className={styles.noData}>Sin datos en este período.</p>;
    }

    // 🧾 CARDS
    if (viewMode === 'cards') {
        return (
            <div className={styles.productRankingGrid} role="list" aria-label="Ranking de productos más vendidos">
                {products.slice(0, 10).map((p, i) => (
                    <ProductReportCard
                        key={p.id}
                        products={[p]}
                        maxRevenue={maxRevenue}
                        formatPrice={formatPrice}
                        position={i + 1}
                    />
                ))}
            </div>
        );
    }

    // 📊 LISTA (la que ya tenías)
    return (
        <div className={styles.productRanking} role="list" aria-label="Ranking de productos más vendidos">
            {products.slice(0, 10).map((p, i) => (
                <div key={p.id} role="listitem">
                    <ProductRankingList
                        product={p}
                        position={i + 1}
                        maxRevenue={maxRevenue}
                        formatPrice={formatPrice}
                    />
                </div>
            ))}
        </div>
    );
}