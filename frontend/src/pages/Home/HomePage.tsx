import { useState, useEffect } from 'react';
import { CategoryGrid } from '../../features/home/CategoryGrid/CategoryGrid';
import { FeaturedProducts } from '../../features/home/FeaturedProducts/FeaturedProducts';
import type { PublicCollection } from '../../services/publicCollectionsService';
import { publicCollectionsService } from '../../services/publicCollectionsService';
import type { PublicBanner } from '../../services/publicBannersService';
import { publicBannersService } from '../../services/publicBannersService';
import CollectionSlider from '../../components/CollectionSlider';
import BannerSlider from '../../components/BannerSlider';
import { Benefits } from '../../features/home/Benefits/Benefits';
import { AboutSection } from '../../features/home/AboutSection/AboutSection';

export function HomePage() {
  const [collections, setCollections] = useState<PublicCollection[]>([]);
  const [banners, setBanners] = useState<PublicBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCollections();
    loadBanners();
  }, []);

  async function loadCollections() {
    setLoading(true);
    setError(null);
    try {
      const data = await publicCollectionsService.getHomeCollections();
      setCollections(data);
    } catch (err) {
      console.error('Error loading home collections:', err);
      setError(null); // No mostrar error al usuario, solo en console
    } finally {
      setLoading(false);
    }
  }

  async function loadBanners() {
    try {
      const data = await publicBannersService.getActiveBanners();
      setBanners(data.sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (err) {
      console.error('Error loading banners:', err);
      // No mostrar error al usuario - los banners son opcionales
    }
  }

  const handleProductClick = (productSlug: string) => {
    window.location.href = `/producto/${productSlug}`;
  };

  return (
    <main>
      {banners.length > 0 && <BannerSlider banners={banners} />}
      <CategoryGrid />
      <FeaturedProducts
        title="Productos destacados"
        label="Lo mejor"
        tag="destacado"
        limit={4}
      />
      <AboutSection />
      
      {/* Secciones de Colecciones - Dinámicas con colores alternados */}
      {loading && (
        <section style={{ background: 'var(--color-primary-light)', padding: '60px 0' }}>
          <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 48px' }}>
            <p style={{ color: '#666' }}>Cargando colecciones especiales...</p>
          </div>
        </section>
      )}
      
      {!loading && !error && collections.length > 0 && (
        <div>
          {collections.map((collection, index) => {
            const isEvenIndex = index % 2 === 0;
            const backgroundColor = isEvenIndex ? 'var(--color-primary-light)' : '#f9fafb';
            
            return (
              <section
                key={collection.id}
                style={{ background: backgroundColor, padding: '60px 0' }}
                aria-label={collection.name}
              >
                <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 48px' }}>
                  <CollectionSlider
                    title={collection.name}
                    description={collection.description}
                    products={collection.products || []}
                    bannerUrl={collection.imageUrl}
                    onProductClick={handleProductClick}
                  />
                </div>
              </section>
            );
          })}
        </div>
      )}
      
      <Benefits />
    </main>
  );
}
