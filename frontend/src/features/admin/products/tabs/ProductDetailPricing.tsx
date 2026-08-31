import type { AdminProduct } from '../../../../context/AdminProductsContext';
import { PackageOpen, DollarSign, AlertTriangle, ShieldCheck } from 'lucide-react';


interface ProductDetailPricingProps {
  product: AdminProduct;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(price);
}

export function ProductDetailPricing({ product }: ProductDetailPricingProps) {
  const threshold = (product as unknown as { criticalStockThreshold?: number }).criticalStockThreshold ?? 5;
  const isOutOfStock = !product.inStock || product.stock <= 0;

  return (
    <div className="pricingContainer">
      <style>{`
        .pricingContainer {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
          box-sizing: border-box;
          padding: 0 !important;
        }

        /* KPIs minimalistas en la parte superior */
        .kpiCardsGrid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 16px;
          width: 100%;
        }

        @media (min-width: 640px) {
          .kpiCardsGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .kpiCard {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--color-border, rgba(229, 226, 221, 0.15));
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .kpiHeader {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-secondary, #9ca3af);
        }

        .kpiValuePrice {
          font-size: 26px;
          font-weight: 800;
          color: var(--color-accent, #DDB08C);
          line-height: 1.1;
        }

        .kpiValueStock {
          font-size: 26px;
          font-weight: 800;
          color: var(--color-text-primary, #ffffff);
          line-height: 1.1;
        }

        .kpiValueStockCritical {
          color: #ef4444;
        }

        .kpiSubLabel {
          font-size: 12px;
          color: var(--color-text-secondary, #9ca3af);
        }

        /* Tabla / Lista de datos limpia */
        .inventorySection {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sectionTitleFlat {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-secondary, #9ca3af);
          border-bottom: 1px solid var(--color-border, rgba(229, 226, 221, 0.15));
          padding-bottom: 8px;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .dataTableFlat {
          width: 100%;
          border-collapse: collapse;
        }

        .dataRowFlat {
          border-bottom: 1px solid var(--color-border, rgba(229, 226, 221, 0.08));
        }

        .dataRowFlat td {
          padding: 12px 4px;
          font-size: 14px;
        }

        .dataLabelCell {
          color: var(--color-text-secondary, #9ca3af);
          font-weight: 500;
          font-size: 13px !important;
        }

        .dataValueCell {
          color: var(--color-text-primary, #ffffff);
          font-weight: 600;
          text-align: right;
        }

        .warningBannerFlat {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #f59e0b;
        }

        .criticalBannerFlat {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
      `}</style>

      {/* KPI Cards */}
      <div className="kpiCardsGrid">
        <div className="kpiCard">
          <div className="kpiHeader">
            <DollarSign size={15} /> Precio Actual
          </div>
          <div className="kpiValuePrice">{formatPrice(product.price)}</div>
          <div className="kpiSubLabel">Precio de venta al público</div>
        </div>

        <div className="kpiCard">
          <div className="kpiHeader">
            <PackageOpen size={15} /> Unidades en Stock
          </div>
          <div className={`kpiValueStock ${product.stock <= threshold ? 'kpiValueStockCritical' : ''}`}>
            {product.stock} un.
          </div>
          <div className="kpiSubLabel">
            {product.inStock ? 'Disponible para venta' : 'Agotado'}
          </div>
        </div>
      </div>

      {/* Desglose de Inventario */}
      <div className="inventorySection">
        <h3 className="sectionTitleFlat">
          <ShieldCheck size={14} /> Inventario y Umbrales
        </h3>

        <table className="dataTableFlat">
          <tbody>
            <tr className="dataRowFlat">
              <td className="dataLabelCell">Stock Físico Total</td>
              <td className="dataValueCell">{product.stock} unidades</td>
            </tr>
            <tr className="dataRowFlat">
              <td className="dataLabelCell">Umbral de Stock Crítico</td>
              <td className="dataValueCell">{threshold} unidades</td>
            </tr>
            <tr className="dataRowFlat">
              <td className="dataLabelCell">Estado de Disponibilidad</td>
              <td className="dataValueCell" style={{ color: product.inStock ? '#10b981' : '#ef4444' }}>
                {product.inStock ? '✓ En Stock' : '✕ Agotado'}
              </td>
            </tr>
          </tbody>
        </table>

        {!isOutOfStock && product.stock <= threshold && product.stock > 0 && (
          <div className="warningBannerFlat">
            <AlertTriangle size={16} />
            <span>Stock bajo: Solo quedan {product.stock} unidades (Umbral crítico: {threshold})</span>
          </div>
        )}

        {isOutOfStock && (
          <div className="criticalBannerFlat">
            <AlertTriangle size={16} />
            <span>Producto agotado: No hay stock disponible</span>
          </div>
        )}
      </div>
    </div>
  );
}