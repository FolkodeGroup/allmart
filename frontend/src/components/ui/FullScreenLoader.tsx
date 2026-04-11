import styles from './FullScreenLoader.module.css';
import logo from '../../assets/images/logos/Allmart (7).svg';

export default function FullScreenLoader() {
  return (
    <div className={styles.loaderOverlay}>
      <div className={styles.loaderContent}>
        <img
          src={logo}
          alt="Allmart Logo"
          className={styles.logo}
        />
        <div className={styles.spinner} />
        <div className={styles.loadingText}>Cargando...</div>
      </div>
    </div>
  );
}
