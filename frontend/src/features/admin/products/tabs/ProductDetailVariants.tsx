import styles from './ProductDetailVariants.module.css';

interface ProductDetailVariantsProps {
  productId: string;
}

export function ProductDetailVariants({ productId }: ProductDetailVariantsProps) {
  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Variantes del producto</h3>
        <p className={styles.info}>
          Edita las variantes de este producto desde la sección de variantes en el menú de administración.
        </p>
        <div className={styles.placeholder}>
          <p>🔄 Gestión de variantes</p>
          <small>ID del producto: {productId}</small>
        </div>
      </section>
    </div>
  );
}
