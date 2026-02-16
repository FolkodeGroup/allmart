import { Hero } from '../../features/home/Hero/Hero';
import { CategoryGrid } from '../../features/home/CategoryGrid/CategoryGrid';
import { FeaturedProducts } from '../../features/home/FeaturedProducts/FeaturedProducts';
import { Benefits } from '../../features/home/Benefits/Benefits';
import { AboutSection } from '../../features/home/AboutSection/AboutSection';

export function HomePage() {
  return (
    <main>
      <Hero />
      <Benefits />
      <CategoryGrid />
      <FeaturedProducts
        title="Productos destacados"
        label="Lo mejor"
        tag="destacado"
        limit={4}
      />
      <AboutSection />
      <FeaturedProducts
        title="Ofertas del mes"
        label="Ahorrá"
        tag="oferta"
        limit={4}
      />
    </main>
  );
}
