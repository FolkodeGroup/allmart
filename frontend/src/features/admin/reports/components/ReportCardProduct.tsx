import styles from '../AdminReports.module.css';
import { ProductRankingList } from './ReportProductRankingList';

type Product = {
    id: string;
    name: string;
    qty: number;
    revenue: number;
    imageUrl?: string;
};

interface ProductRankingListProps {
    products: Product[];
    maxRevenue: number;
    formatPrice: (n: number) => string;
    position: number;
}

export function ProductReportCard({
    products,
    maxRevenue,
    formatPrice,
    position
}: ProductRankingListProps) {
    // Limit to top 10
    const topProducts = products.slice(0, 10);
    return (
        <div className={styles.productRankingCardsContainer} role="list" aria-label="Ranking de productos más vendidos">
            {topProducts.map((product, i) => (
                <div key={product.id} role="listitem">
                    <ProductRankingList
                        product={product}
                        position={position || i + 1}
                        maxRevenue={maxRevenue}
                        formatPrice={formatPrice}
                    />
                </div>
            ))}
        </div>
    );
}