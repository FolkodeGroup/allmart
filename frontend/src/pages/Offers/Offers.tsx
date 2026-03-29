/**
 * pages/Offers/Offers.tsx
 * Página pública para mostrar todas las promociones activas.
 */

import React, { useEffect, useState } from 'react';
import { publicCollectionsService, PublicPromotion, PublicCollection } from '../../services/publicCollectionsService';
import CollectionSlider from '../../components/CollectionSlider';
import styles from './Offers.module.css';

const Offers: React.FC = () => {
  const [promotions, setPromotions] = useState<PublicPromotion[]>([]);
  const [collections, setCollections] = useState<PublicCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOffersData();
  }, []);

  async function loadOffersData() {
    setLoading(true);
    setError(null);
    try {
      const [promosResult, collectionsResult] = await Promise.all([
        publicCollectionsService.getActivePromotions(),
        publicCollectionsService.getHomeCollections(),
      ]);
      setPromotions(promosResult);
      setCollections(collectionsResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando ofertas');
      console.error('Error loading offers:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleProductClick = (productSlug: string) => {
    window.location.href = `/products/${productSlug}`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSection}>
          <p>Cargando ofertas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorSection}>
          <p>Error: {error}</p>
          <button onClick={loadOffersData}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Nuestras Ofertas</h1>
        <p>Descubre todas nuestras promociones y descuentos especiales</p>
      </header>

      {/* Sección de Colecciones */}
      {collections.length > 0 && (
        <section className={styles.section}>
          <h2>Colecciones Especiales</h2>
          <div className={styles.collectionsGrid}>
            {collections.map((collection) => (
              <CollectionSlider
                key={collection.id}
                title={collection.name}
                description={collection.description}
                products={collection.products || []}
                bannerUrl={collection.imageUrl}
                onProductClick={handleProductClick}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sección de Promociones Activas */}
      {promotions.length > 0 && (
        <section className={styles.section}>
          <h2>Promociones Activas</h2>
          <div className={styles.promotionsGrid}>
            {promotions.map((promo) => (
              <div key={promo.id} className={styles.promotionCard}>
                <div className={styles.promotionHeader}>
                  <h3>{promo.name}</h3>
                  <span className={styles.promotionType}>
                    {promo.type === 'percentage'
                      ? '%'
                      : promo.type === 'fixed'
                      ? '$'
                      : 'BOGO'}
                  </span>
                </div>

                {promo.description && (
                  <p className={styles.promotionDescription}>{promo.description}</p>
                )}

                <div className={styles.promotionValue}>
                  {promo.type === 'percentage' && <span>{promo.value}% OFF</span>}
                  {promo.type === 'fixed' && <span>${promo.value} OFF</span>}
                  {promo.type === 'bogo' && <span>Compra 1, Lleva 1 Gratis</span>}
                </div>

                <div className={styles.promotionDates}>
                  <small>
                    {new Date(promo.startDate).toLocaleDateString('es-ES')} -{' '}
                    {new Date(promo.endDate).toLocaleDateString('es-ES')}
                  </small>
                </div>

                {promo.minPurchaseAmount && (
                  <p className={styles.promotionCondition}>
                    Mínimo: ${promo.minPurchaseAmount}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {collections.length === 0 && promotions.length === 0 && (
        <div className={styles.emptyState}>
          <p>No hay ofertas disponibles en este momento</p>
        </div>
      )}
    </div>
  );
};

export default Offers;
