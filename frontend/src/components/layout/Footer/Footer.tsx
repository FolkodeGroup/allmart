import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { NavigationItem } from '../../../types';
import { fetchPublicCategories } from '../../../services/categoriesService';
import { buildNavigationFromCategories, fallbackNavigation } from '../navigation/publicNavigation';
import styles from './Footer.module.css';

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={styles.socialIcon}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 0C5.829 0 5.556.01 4.703.048c-.85.038-1.431.173-1.94.37a3.92 3.92 0 0 0-1.417.923A3.924 3.924 0 0 0 .423 2.758c-.197.51-.332 1.091-.37 1.94C.012 5.555 0 5.828 0 8s.01 2.445.048 3.297c.038.85.173 1.431.37 1.94.203.527.48.974.923 1.417.444.443.89.72 1.417.923.51.197 1.091.332 1.94.37C5.555 15.988 5.828 16 8 16s2.445-.01 3.297-.048c.85-.038 1.431-.173 1.94-.37a3.93 3.93 0 0 0 1.417-.923 3.93 3.93 0 0 0 .923-1.417c.197-.51.332-1.091.37-1.94C15.988 10.445 16 10.172 16 8s-.01-2.445-.048-3.297c-.038-.85-.173-1.431-.37-1.94a3.924 3.924 0 0 0-.923-1.417A3.924 3.924 0 0 0 13.242.423c-.51-.197-1.091-.332-1.94-.37C10.445.012 10.172 0 8 0m0 1.44c2.135 0 2.387.008 3.232.046.781.036 1.206.166 1.488.276.374.145.641.318.92.597.28.279.453.546.598.92.109.282.24.707.275 1.488.038.845.046 1.097.046 3.232s-.008 2.387-.046 3.232c-.036.781-.166 1.206-.276 1.488a2.49 2.49 0 0 1-.597.92 2.49 2.49 0 0 1-.92.598c-.282.109-.707.24-1.488.275-.845.038-1.097.046-3.232.046s-2.387-.008-3.232-.046c-.781-.036-1.206-.166-1.488-.276a2.49 2.49 0 0 1-.92-.597 2.49 2.49 0 0 1-.598-.92c-.109-.282-.24-.707-.275-1.488C1.448 10.387 1.44 10.135 1.44 8s.008-2.387.046-3.232c.036-.781.166-1.206.276-1.488.145-.374.318-.641.597-.92.279-.28.546-.453.92-.598.282-.109.707-.24 1.488-.275C5.613 1.448 5.865 1.44 8 1.44" />
      <path d="M8 3.892A4.108 4.108 0 1 0 8 12.108 4.108 4.108 0 0 0 8 3.892m0 6.776A2.668 2.668 0 1 1 8 5.332a2.668 2.668 0 0 1 0 5.336m4.27-6.945a.96.96 0 1 1-1.92 0 .96.96 0 0 1 1.92 0" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={styles.socialIcon}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M13.601 2.326A7.92 7.92 0 0 0 8.02 0C3.66 0 .11 3.55.11 7.91c0 1.395.365 2.757 1.06 3.958L0 16l4.247-1.114a7.87 7.87 0 0 0 3.77.957h.003c4.36 0 7.91-3.55 7.91-7.91a7.88 7.88 0 0 0-2.33-5.607M8.02 14.5h-.003a6.53 6.53 0 0 1-3.325-.91l-.238-.141-2.52.661.673-2.456-.155-.251a6.53 6.53 0 0 1-1.006-3.493c0-3.604 2.932-6.536 6.537-6.536 1.743 0 3.38.68 4.614 1.913a6.51 6.51 0 0 1 1.916 4.625c-.002 3.604-2.934 6.536-6.537 6.536m3.584-4.892c-.197-.099-1.17-.578-1.352-.644s-.315-.099-.447.099-.513.644-.63.776-.23.148-.427.05c-.197-.099-.83-.306-1.58-.977-.584-.52-.979-1.162-1.093-1.359s-.012-.304.086-.402c.089-.088.197-.23.296-.345.099-.116.132-.198.198-.33.066-.132.033-.248-.017-.347-.05-.099-.447-1.078-.612-1.477-.161-.387-.325-.335-.447-.341l-.38-.007c-.132 0-.347.05-.529.248s-.694.677-.694 1.652.71 1.916.809 2.048c.099.132 1.397 2.133 3.386 2.992.473.204.843.326 1.132.417.476.152.91.131 1.253.08.382-.057 1.17-.478 1.336-.94.165-.463.165-.859.116-.94-.05-.082-.182-.132-.38-.231" />
    </svg>
  );
}

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
              href="https://www.instagram.com/allmart.bazar"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Instagram"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://wa.me/+5491165891091"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="WhatsApp"
            >
              <WhatsAppIcon />
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
          <span>© {new Date().getFullYear()} Allmart. Todos los derechos reservados. Desarrollado por <a href="https://www.folkode.com.ar" target="_blank" rel="noopener noreferrer">Folkode</a></span>
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
