import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { NavigationItem } from '../../../types';
import { fetchPublicCategories } from '../../../services/categoriesService';
import { buildNavigationFromCategories, fallbackNavigation } from '../navigation/publicNavigation';
import styles from './Footer.module.css';

export function Footer() {
  const [productLinks, setProductLinks] = useState<NavigationItem[]>(fallbackNavigation);

  useEffect(() => {
    let ignore = false;

    fetchPublicCategories()
      .then((categories) => {
        if (!ignore && categories.length > 0) {
          setProductLinks(buildNavigationFromCategories(categories));
        }
      })
      .catch(() => {
        if (!ignore) {
          setProductLinks(fallbackNavigation);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.grid}>
        {/* Brand */}
        <div className={styles.brandCol}>
          <Link to="/" className={styles.brandLogo} aria-label="Allmart - Inicio">
            allmart
          </Link>
          <p className={styles.brandDesc}>
            Una forma práctica de disfrutar tu hogar. Productos de bazar,
            decoración, cocina y más para abastecer tu comercio o equipar tu
            hogar con lo mejor.
          </p>
          <div className={styles.socials} aria-label="Redes sociales">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Instagram"
            >
              IG
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Facebook"
            >
              FB
            </a>
            <a
              href="https://wa.me/5491100000000"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="WhatsApp"
            >
              WA
            </a>
          </div>
        </div>

        {/* Productos */}
        <div className={styles.linksCol}>
          <h3 className={styles.colTitle}>Productos</h3>
          {productLinks.map((item) => (
            <Link key={item.href} to={item.href} className={styles.colLink}>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Ayuda */}
        <div className={styles.linksCol}>
          <h3 className={styles.colTitle}>Ayuda</h3>
          <Link to="/como-comprar" className={styles.colLink}>Cómo comprar</Link>
          <Link to="/envios" className={styles.colLink}>Envíos</Link>
          <Link to="/preguntas-frecuentes" className={styles.colLink}>Preguntas frecuentes</Link>
          <Link to="/contacto" className={styles.colLink}>Contacto</Link>
        </div>

        {/* Legal */}
        <div className={styles.linksCol}>
          <h3 className={styles.colTitle}>Legal</h3>
          <Link to="/terminos" className={styles.colLink}>Términos y condiciones</Link>
          <Link to="/privacidad" className={styles.colLink}>Política de privacidad</Link>
          <Link to="/arrepentimiento" className={styles.colLink}>Botón de arrepentimiento</Link>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <span>© {new Date().getFullYear()} Allmart. Todos los derechos reservados.</span>
          <div className={styles.bottomLinks}>
            <Link to="/terminos" className={styles.bottomLink}>
              Términos
            </Link>
            <Link to="/privacidad" className={styles.bottomLink}>
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
