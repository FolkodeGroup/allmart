import styles from './ProductDetailImages.module.css';

interface ProductDetailImagesProps {
  productId: string;
}

export function ProductDetailImages({ productId }: ProductDetailImagesProps) {
  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Imágenes del producto</h3>
        <p className={styles.info}>
          Edita las imágenes de este producto desde la sección de imágenes en el menú de administración.
        </p>
        <div className={styles.placeholder}>
          <p>🖼️ Gestión de imágenes</p>
          <small>ID del producto: {productId}</small>
        </div>
      </section>
    </div>
  );
}
