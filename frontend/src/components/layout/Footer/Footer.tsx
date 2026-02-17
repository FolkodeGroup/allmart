import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export function Footer() {
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
          <Link to="/productos?tag=oferta" className={styles.colLink}>Ofertas</Link>
          <Link to="/productos?tag=nuevo" className={styles.colLink}>Novedades</Link>
          <Link to="/productos?category=cocina" className={styles.colLink}>Cocina</Link>
          <Link to="/productos?category=hogar-deco" className={styles.colLink}>Hogar & Deco</Link>
          <Link to="/productos?category=bano" className={styles.colLink}>Baño</Link>
          <Link to="/productos" className={styles.colLink}>Ver todo el catálogo</Link>
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
