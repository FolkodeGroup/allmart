import { useState, useEffect } from 'react';
import { CategoryGrid } from '../../features/home/CategoryGrid/CategoryGrid';
import { FeaturedProducts } from '../../features/home/FeaturedProducts/FeaturedProducts';
import type { PublicCollection } from '../../services/publicCollectionsService';
import { publicCollectionsService } from '../../services/publicCollectionsService';
import type { PublicBanner } from '../../services/publicBannersService';
import { publicBannersService } from '../../services/publicBannersService';
import { fetchPublicProducts } from '../../services/productsService';
import CollectionSlider from '../../components/CollectionSlider';
import '../../styles/collections.css';
import BannerSlider from '../../components/BannerSlider';
import { Benefits } from '../../features/home/Benefits/Benefits';
import { AboutSection } from '../../features/home/AboutSection/AboutSection';
import { ContactForm } from '../../features/home/ContactForm/ContactForm';

export function HomePage() {
  const [collections, setCollections] = useState<PublicCollection[]>(
    () => publicCollectionsService.getCached() ?? []
  );
  
  const [banners, setBanners] = useState<PublicBanner[]>(
    () => publicBannersService.getCached() ?? []
  );
  
  const [loading, setLoading] = useState(
    () => publicCollectionsService.getCached() === null
  );
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
      
      // Extraer slugs de todos los productos de todas las colecciones
      const allSlugs = data
        .flatMap(col => col.products?.map(p => p.slug) || [])
        .filter(Boolean);

      if (allSlugs.length > 0) {
        try {
          // Consultar en lote las imágenes en vivo desde R2
          const productsResponse = await fetchPublicProducts({ slugs: allSlugs.join(','), limit: 100 });
          
          const imageMap = new Map<string, string>();
          productsResponse.data.forEach(p => {
            if (Array.isArray(p.images) && p.images.length > 0) {
              const first = p.images[0];
              const url = typeof first === 'string' 
                ? first 
                : (first && typeof first === 'object' && typeof first.url === 'string' ? first.url : '');
              if (url) {
                // 🟢 CLAVE: Guardamos en el mapa usando el ID como clave, que es inmutable
                imageMap.set(p.id, url);
              }
            }
          });

          // Inyectar las imágenes reales de R2 sobre las colecciones usando ID
          const updatedCollections = data.map(col => ({
            ...col,
            products: col.products?.map(p => ({
              ...p,
              imageUrl: imageMap.get(p.id) || p.imageUrl
            }))
          }));

          setCollections(updatedCollections);
        } catch (fetchErr) {
          console.error('Error al sincronizar imágenes en vivo para las colecciones del Home:', fetchErr);
          setCollections(data);
        }
      } else {
        setCollections(data);
      }
    } catch (err) {
      console.error('Error loading home collections:', err);
      setError(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadBanners() {
    try {
      const data = await publicBannersService.getActiveBanners();
      setBanners(data);
    } catch (err) {
      console.error('Error loading banners:', err);
    }
  }

  const handleProductClick = (productSlug: string) => {
    window.location.href = `/producto/${productSlug}`;
  };

  return (
    <main>
      {/* 🟢 Renderizado inmediato si la promesa ya está resuelta o en caché */}
      {banners.length > 0 && <BannerSlider banners={banners} />}
      <CategoryGrid />
      <FeaturedProducts
        title="Productos Destacados"
        tag="destacado"
        limit={4}
      />
      <AboutSection />

      {/* Secciones de Colecciones */}
      {loading && (
        <section className="collection-section collection-section--primary">
          <div className="section-inner">
            <p style={{ color: 'var(--color-text-secondary)' }}>Cargando colecciones especiales...</p>
          </div>
        </section>
      )}

      {!loading && !error && collections.length > 0 && (
        <div>
          {collections.map((collection, index) => {
            const isEvenIndex = index % 2 === 0;
            const themeClass = isEvenIndex ? 'collection-section--primary' : 'collection-section--inverse';

            return (
              <section
                key={collection.id}
                className={`collection-section ${themeClass}`}
                aria-label={collection.name}
              >
                <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 var(--space-10)' }} className="section-inner">
                  <CollectionSlider
                    title={collection.name}
                    slug={collection.slug}
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

      <ContactForm />
      <Benefits />
    </main>
  );
}