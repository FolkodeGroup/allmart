import { lazy, Suspense, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { PublicCollection } from '../../services/publicCollectionsService';
import { publicCollectionsService } from '../../services/publicCollectionsService';
import type { PublicBanner } from '../../services/publicBannersService';
import { publicBannersService } from '../../services/publicBannersService';
import { fetchPublicProducts } from '../../services/productsService';
import { bannerFilterToUrl } from '../../utils/bannerFilterToUrl';
import { DEFAULT_IMAGE_PLACEHOLDER } from '../../utils/imageUrl';

const CategoryGrid = lazy(() => import('../../features/home/CategoryGrid/CategoryGrid').then((m) => ({ default: m.CategoryGrid })));
const FeaturedProducts = lazy(() => import('../../features/home/FeaturedProducts/FeaturedProducts').then((m) => ({ default: m.FeaturedProducts })));
const AboutSection = lazy(() => import('../../features/home/AboutSection/AboutSection').then((m) => ({ default: m.AboutSection })));
const ContactForm = lazy(() => import('../../features/home/ContactForm/ContactForm').then((m) => ({ default: m.ContactForm })));
const Benefits = lazy(() => import('../../features/home/Benefits/Benefits').then((m) => ({ default: m.Benefits })));
const BannerSlider = lazy(() => import('../../components/BannerSlider'));
const CollectionSlider = lazy(() => import('../../components/CollectionSlider'));

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

  const heroBanner = banners[0] ?? null;
  const heroImageUrl = heroBanner?.thumbUrl || heroBanner?.imageUrl || DEFAULT_IMAGE_PLACEHOLDER;
  const heroTarget = heroBanner ? bannerFilterToUrl(heroBanner.filterConfig ?? {}) : '/productos';

  return (
    <main>
      <section
        aria-label={heroBanner?.title ?? 'Destacado principal'}
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0',
        }}
      >
        <Link
          to={heroTarget}
          style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
          aria-label={heroBanner?.title ? `Ver promoción ${heroBanner.title}` : 'Ver promociones'}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 6',
              overflow: 'hidden',
              background: '#f5f5f5',
            }}
          >
            <img
              src={heroImageUrl}
              alt={heroBanner?.altText || heroBanner?.title || 'Promoción destacada'}
              width="1186"
              height="667"
              fetchPriority="high"
              loading="eager"
              decoding="async"
              sizes="(max-width: 768px) 100vw, 1600px"
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        </Link>
      </section>

      <Suspense fallback={(
        <section aria-label="Cargando secciones destacadas" style={{ minHeight: '980px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 24px 0' }}>
            <div style={{ height: '28px', width: '240px', background: '#e6e2dd', borderRadius: '4px', marginBottom: '16px' }} />
            <div style={{ height: '54px', width: '380px', background: '#f0ece7', borderRadius: '8px', marginBottom: '28px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} style={{ height: '180px', background: '#f2efeb', borderRadius: '18px' }} />
              ))}
            </div>
          </div>
        </section>
      )}>
        <CategoryGrid />
        <FeaturedProducts
          title="Productos Destacados"
          tag="destacado"
          limit={4}
        />
        <AboutSection />
      </Suspense>

      <Suspense fallback={<div style={{ minHeight: '480px' }} />}>
        {banners.length > 1 && (
          <section
            aria-label="Más promociones"
            style={{
              padding: 'var(--space-16) 0',
              background: 'linear-gradient(180deg, rgba(var(--color-primary-light-rgb), 1) 0%, rgba(var(--color-primary-light-rgb), 0.12) 82%, rgba(255, 255, 255, 1) 100%)',
            }}
          >
            <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 var(--space-10)' }}>
              <BannerSlider banners={banners.slice(1)} />
            </div>
          </section>
        )}
      </Suspense>

      {/* Secciones de Colecciones */}
      {loading && (
        <section className="collection-section collection-section--primary" style={{ minHeight: '480px' }}>
          <div className="section-inner" style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 var(--space-10)' }}>
            {/* 🟢 Solución CLS: Placeholder sutil para evitar el colapso de altura en carga */}
            <div style={{ height: '32px', width: '280px', background: '#e6e2dd', marginBottom: '24px', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
            <div style={{ display: 'flex', gap: '20px', overflow: 'hidden' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ flex: '0 0 280px', height: '340px', background: '#f2efeb', borderRadius: '14px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
              ))}
            </div>
          </div>
          <style>{`
            @keyframes pulse {
              0% { opacity: 0.6; }
              50% { opacity: 1; }
              100% { opacity: 0.6; }
            }
          `}</style>
        </section>
      )}

      {!loading && !error && collections.length > 0 && (
        <Suspense fallback={(
          <section className="collection-section collection-section--primary" style={{ minHeight: '480px' }}>
            <div className="section-inner" style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 var(--space-10)' }}>
              <div style={{ height: '32px', width: '280px', background: '#e6e2dd', marginBottom: '24px', borderRadius: '4px' }} />
              <div style={{ display: 'flex', gap: '20px', overflow: 'hidden' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ flex: '0 0 280px', height: '340px', background: '#f2efeb', borderRadius: '14px' }} />
                ))}
              </div>
            </div>
          </section>
        )}>
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
        </Suspense>
      )}

      <Suspense fallback={<div style={{ minHeight: '560px' }} />}>
        <ContactForm />
        <Benefits />
      </Suspense>
    </main>
  );
}