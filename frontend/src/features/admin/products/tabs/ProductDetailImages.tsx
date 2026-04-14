import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../../../../context/AdminAuthContext';
import { updateAdminProduct } from '../productsService';
import styles from './ProductDetailImages.module.css';
import { ImagesGrid } from './ProductDetailImagesGrid';
import { ImageUpload } from './ProductDetailImagesUpload';
import type { ProductImage, ProductVariant } from './ProductDetailImages.types';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress } from '@mui/material';

interface ProductDetailImagesProps {
  productId: string;
}

// Simulación de fetch de imágenes y variantes (reemplazar por API real)
const fetchImages = async (): Promise<ProductImage[]> => {
  // TODO: Reemplazar por llamada real a backend
  return [
    { id: '1', url: 'https://via.placeholder.com/300x300?text=Imagen+1', isThumbnail: true, variantIds: ['a'] },
    { id: '2', url: 'https://via.placeholder.com/300x300?text=Imagen+2', isThumbnail: false, variantIds: ['b'] },
    { id: '3', url: 'https://via.placeholder.com/300x300?text=Imagen+3', isThumbnail: false, variantIds: [] },
  ];
};
const fetchVariants = async (): Promise<ProductVariant[]> => {
  // TODO: Reemplazar por llamada real a backend
  return [
    { id: 'a', name: 'Rojo' },
    { id: 'b', name: 'Azul' },
    { id: 'c', name: 'Verde' },
  ];
};

export function ProductDetailImages({ productId }: ProductDetailImagesProps) {
  const { token } = useAdminAuth();
  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchImages(), fetchVariants()])
      .then(([imgs, vars]) => {
        setImages(imgs);
        setVariants(vars);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  // Upload handler (simulado)
  const handleUpload = useCallback((files: FileList) => {
    const previews = Array.from(files).map((file, idx) => ({
      id: `new-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      isThumbnail: false,
      variantIds: [],
    }));
    setImages((prev) => [...prev, ...previews]);
  }, []);

  // Drag-and-drop reorder handler real
  const handleReorder = async (newImages: ProductImage[]) => {
    setImages(newImages);
    if (!token) return;
    try {
      // Solo enviamos los IDs de las imágenes en el nuevo orden
      const imageUrls = newImages.map(img => img.url);
      await updateAdminProduct(productId, { images: imageUrls }, token);
    } catch (err) {
      // Si falla, revertimos el orden local y mostramos error
      setImages(images);
      alert('Error al actualizar el orden de imágenes');
    }
  };

  // Eliminar imagen
  const handleDelete = (id: string) => setDeleteId(id);
  const confirmDelete = () => {
    setImages((prev) => prev.filter((img) => img.id !== deleteId));
    setDeleteId(null);
  };

  // Set thumbnail
  const handleSetThumbnail = (id: string) => {
    setImages((prev) => prev.map((img) => ({ ...img, isThumbnail: img.id === id })));
  };

  // Asociar/desasociar variante
  const handleAssociateVariant = (imageId: string, variantId: string) => {
    setImages((prev) => prev.map((img) => img.id === imageId ? { ...img, variantIds: [...img.variantIds, variantId] } : img));
  };
  const handleDisassociateVariant = (imageId: string, variantId: string) => {
    setImages((prev) => prev.map((img) => img.id === imageId ? { ...img, variantIds: img.variantIds.filter((v) => v !== variantId) } : img));
  };

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <Typography variant="h5" className={styles.sectionTitle} gutterBottom>
          Imágenes del producto
        </Typography>
        <Typography className={styles.info}>
          Gestiona las imágenes de este producto. Puedes subir, reordenar, eliminar y asociar imágenes a variantes específicas.
        </Typography>
        <Box mt={2} mb={2}>
          <ImageUpload onUpload={handleUpload} />
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : (
          <ImagesGrid
            images={images}
            variants={variants}
            onDelete={handleDelete}
            onSetThumbnail={handleSetThumbnail}
            onAssociateVariant={handleAssociateVariant}
            onDisassociateVariant={handleDisassociateVariant}
            onReorder={handleReorder}
          />
        )}
      </section>
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>¿Eliminar imagen?</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de que deseas eliminar esta imagen? Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button color="error" onClick={confirmDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
