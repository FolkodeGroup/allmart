// ...existing code...

import { HeroSlider } from './HeroSlider';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section className={styles.hero} aria-label="Presentación principal">
      <HeroSlider />
    </section>
  );
}
