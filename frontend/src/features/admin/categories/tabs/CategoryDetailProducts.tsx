import { useMemo } from 'react';
import type { Category } from '../../../../types';
import { Layers, AlertTriangle, Package } from 'lucide-react';
import { useAdminProducts } from '../../../../context/useAdminProductsContext';

interface CategoryDetailProductsProps {
  category: Category;
}

export function CategoryDetailProducts({ category }: CategoryDetailProductsProps) {
  const { products } = useAdminProducts();

  // Filter products by category
  const categoryProducts = useMemo(() => {
    return products.filter((p) => {
      // Check if product's categoryId or categoryIds includes this category's ID
      return p.categoryId === category.id ||
             (Array.isArray(p.categoryIds) && p.categoryIds.includes(category.id));
    });
  }, [products, category.id]);

  const isEmpty = categoryProducts.length === 0;
  const productCount = categoryProducts.length;

  return (
    <div className="catProductsContainer">
      <style>{`
        .catProductsContainer {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
          box-sizing: border-box;
          padding: 0 !important;
        }

        .catProductsSection {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .catProductsSectionTitle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-secondary, #9ca3af);
          border-bottom: 1px solid var(--color-border, rgba(229, 226, 221, 0.15));
          padding-bottom: 8px;
          margin: 0;
        }

        .catProductsCountCard {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--color-border, rgba(229, 226, 221, 0.15));
          border-radius: 12px;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          text-align: center;
        }

        .catProductsCountIcon {
          color: var(--color-primary, #769282);
          opacity: 0.8;
        }

        .catProductsCountValue {
          font-size: 32px;
          font-weight: 800;
          color: var(--color-text-primary, #ffffff);
          line-height: 1.1;
        }

        .catProductsCountLabel {
          font-size: 12px;
          color: var(--color-text-secondary, #9ca3af);
          font-weight: 500;
        }

        .catProductsEmptyState {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px 20px;
          text-align: center;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--color-border, rgba(229, 226, 221, 0.15));
        }

        .catProductsEmptyIcon {
          color: var(--color-text-secondary, #9ca3af);
          opacity: 0.5;
        }

        .catProductsEmptyTitle {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text-primary, #ffffff);
          margin: 0;
        }

        .catProductsEmptyDesc {
          font-size: 12px;
          color: var(--color-text-secondary, #9ca3af);
          margin: 0;
          line-height: 1.4;
        }

        .catProductsWarningBanner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #f59e0b;
        }

        .catProductsWarningIcon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .catProductsInfo {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--color-border, rgba(229, 226, 221, 0.15));
          border-radius: 8px;
        }

        .catProductsInfoRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .catProductsInfoLabel {
          font-size: 12px;
          color: var(--color-text-secondary, #9ca3af);
          font-weight: 500;
        }

        .catProductsInfoValue {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-primary, #ffffff);
        }

        .catProductsListContainer {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .catProductsCard {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--color-border, rgba(229, 226, 221, 0.15));
          border-radius: 8px;
          transition: all 0.15s ease;
          align-items: stretch;
        }

        .catProductsCard:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: var(--color-border, rgba(229, 226, 221, 0.25));
        }

        .catProductsCardImage {
          width: 60px;
          height: 60px;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--color-border, rgba(229, 226, 221, 0.1));
        }

        .catProductsCardImage img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .catProductsCardContent {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          justify-content: center;
        }

        .catProductsCardName {
          font-weight: 600;
          font-size: 13px;
          color: var(--color-text-primary, #ffffff);
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .catProductsCardMeta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
        }

        .catProductsCardSku {
          font-family: monospace;
          color: var(--color-text-secondary, #9ca3af);
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: 3px;
          white-space: nowrap;
        }

        .catProductsCardPrice {
          font-weight: 700;
          color: var(--color-primary, #769282);
          white-space: nowrap;
        }

        .catProductsCardActions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          justify-content: center;
          align-items: flex-end;
        }

        .catProductsCardStock {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .catProductsCardStockLabel {
          font-size: 9px;
          text-transform: uppercase;
          color: var(--color-text-secondary, #9ca3af);
          font-weight: 700;
          letter-spacing: 0.03em;
        }

        .catProductsCardStockValue {
          font-size: 14px;
          font-weight: 700;
        }

        .catProductsCardStatusBadge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .catProductsCardStatusAvailable {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .catProductsCardStatusUnavailable {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .catProductsStockLow {
          color: #f59e0b;
        }

        .catProductsStockCritical {
          color: #ef4444;
        }

        @media (max-width: 1023px) {
          .catProductsCard {
            padding: 10px;
            gap: 10px;
          }

          .catProductsCardImage {
            width: 50px;
            height: 50px;
          }

          .catProductsCardActions {
            gap: 6px;
          }
        }
      `}</style>

      {/* Resumen de productos */}
      <div className="catProductsSection">
        <h3 className="catProductsSectionTitle">
          <Package size={13} /> Productos Asignados
        </h3>

        {isEmpty ? (
          <>
            <div className="catProductsEmptyState">
              <Package size={40} className="catProductsEmptyIcon" />
              <h4 className="catProductsEmptyTitle">Sin productos</h4>
              <p className="catProductsEmptyDesc">
                Esta categoría aún no tiene productos asignados.
              </p>
            </div>

            <div className="catProductsWarningBanner">
              <AlertTriangle size={16} className="catProductsWarningIcon" />
              <span>Considera agregar productos a esta categoría para mejorar la experiencia de compra.</span>
            </div>
          </>
        ) : (
          <>
            <div className="catProductsCountCard">
              <Layers size={32} className="catProductsCountIcon" />
              <div className="catProductsCountValue">{productCount}</div>
              <div className="catProductsCountLabel">
                {productCount === 1 ? 'Producto' : 'Productos'}
              </div>
            </div>

            {/* Productos List */}
            <div className="catProductsListContainer">
              {categoryProducts.map((product) => {
                const stockStatus = product.stock === 0
                  ? 'critical'
                  : product.stock <= 5
                  ? 'low'
                  : 'normal';

                const productImage = product.images && product.images.length > 0
                  ? product.images[0]
                  : null;

                return (
                  <div key={product.id} className="catProductsCard">
                    {/* Product Image */}
                    <div className="catProductsCardImage">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={product.name}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Package size={24} style={{ color: 'rgba(255, 255, 255, 0.2)' }} />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="catProductsCardContent">
                      <div className="catProductsCardName">{product.name}</div>
                      <div className="catProductsCardMeta">
                        <span className="catProductsCardSku">{product.sku || '—'}</span>
                        {product.price && (
                          <span className="catProductsCardPrice">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock & Status */}
                    <div className="catProductsCardActions">
                      <div className="catProductsCardStock">
                        <span className="catProductsCardStockLabel">Stock</span>
                        <span className={`catProductsCardStockValue ${
                          stockStatus === 'critical' ? 'catProductsStockCritical' :
                          stockStatus === 'low' ? 'catProductsStockLow' : ''
                        }`}>
                          {product.stock}
                        </span>
                      </div>
                      <span className={`catProductsCardStatusBadge ${
                        product.inStock
                          ? 'catProductsCardStatusAvailable'
                          : 'catProductsCardStatusUnavailable'
                      }`}>
                        {product.inStock ? 'Disponible' : 'Agotado'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="catProductsInfo">
              <p className="catProductsNote">
                Para modificar la asignación de productos o agregar nuevos, accedé a la sección de Productos en el menú principal.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
