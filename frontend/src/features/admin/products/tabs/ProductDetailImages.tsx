import { Typography } from '@mui/material';
import styles from './ProductDetailImages.module.css';

interface ProductDetailImagesProps {
  productId: string;
}

export function ProductDetailImages(_: ProductDetailImagesProps) {
  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <Typography variant="h5" className={styles.sectionTitle} gutterBottom>
          Imágenes del producto
        </Typography>
        <Typography className={styles.info}>
          Las imágenes se pueden gestionar desde el formulario de edición del producto. Ve a la caja de diálogo de edición para subir, reordenar o eliminar imágenes.
        </Typography>
      </section>
    </div>
  );
}
