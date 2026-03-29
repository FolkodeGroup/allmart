import { useState, useEffect } from 'react';
import { Hero } from '../../features/home/Hero/Hero';
import { CategoryGrid } from '../../features/home/CategoryGrid/CategoryGrid';
import { FeaturedProducts } from '../../features/home/FeaturedProducts/FeaturedProducts';
import type { PublicCollection } from '../../services/publicCollectionsService';
import { publicCollectionsService } from '../../services/publicCollectionsService';
import CollectionSlider from '../../components/CollectionSlider';
import { Benefits } from '../../features/home/Benefits/Benefits';
import { AboutSection } from '../../features/home/AboutSection/AboutSection';

export function HomePage() {
  const [collections, setCollections] = useState<PublicCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCollections();
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

  const handleProductClick = (productSlug: string) => {
    window.location.href = `/producto/${productSlug}`;
  };

  return (
    <main>
      <Hero />
      <CategoryGrid />
      <FeaturedProducts
        title="Productos destacados"
        label="Lo mejor"
        tag="destacado"
        limit={4}
      />
      <AboutSection />
      
      {/* Sección Ofertas del Mes - Dinámico */}
      {!error && (collections.length > 0 || loading) && (
        <section style={{ background: 'var(--color-primary-light)', padding: '60px 0' }} aria-label="Ofertas del mes">
          <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 48px' }}>
            <span style={{ color: '#a67c52', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, fontSize: 14 }}>Ahorrá</span>
            <h2 style={{ fontSize: 32, fontWeight: 800, margin: '8px 0 24px 0' }}>Ofertas del mes</h2>
            
            {loading && <p style={{ color: '#666' }}>Cargando colecciones especiales...</p>}
            
            {!loading && collections.length > 0 && (
              <div>
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
            )}
          </div>
        </section>
      )}
      
      <Benefits />
    </main>
  );
}
