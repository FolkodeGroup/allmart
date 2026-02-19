import { Hero } from '../../features/home/Hero/Hero';
import { CategoryGrid } from '../../features/home/CategoryGrid/CategoryGrid';
import { FeaturedProducts } from '../../features/home/FeaturedProducts/FeaturedProducts';

import { sliderLocalProducts } from '../../data/sliderLocalProducts';
import Slider from '../../components/ui/Slider/Slider';
import { Benefits } from '../../features/home/Benefits/Benefits';
import { AboutSection } from '../../features/home/AboutSection/AboutSection';

export function HomePage() {
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
      <section style={{ background: 'var(--color-primary-light)', padding: '60px 0' }} aria-label="Ofertas del mes">
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 48px' }}>
          <span style={{ color: '#a67c52', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, fontSize: 14 }}>Ahorrá</span>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: '8px 0 24px 0' }}>Ofertas del mes</h2>
          <Slider products={sliderLocalProducts} itemsPerPage={5} />
        </div>
      </section>
      <Benefits />
    </main>
  );
}
