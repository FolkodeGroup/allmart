import { useState, useRef, useEffect } from 'react';
import { useAdminImages } from '../../../../context/AdminImagesContext';
import { useAdminProducts } from '../../../../context/useAdminProductsContext';
import styles from './ProductDetailImages.module.css';

interface ProductDetailImagesProps {
  productId: string;
}

export function ProductDetailImages({ productId }: ProductDetailImagesProps) {
  const { images, isLoading, error, uploadImage, deleteImage, loadImages } = useAdminImages();
  const { refreshProducts } = useAdminProducts();
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgAlt, setImgAlt] = useState('');
  const [imgError, setImgError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    loadImages(productId); 
  }, [productId, loadImages]); 

  const handleUpload = async () => {
    setImgError('');
    if (!imgFile) return setImgError('Seleccioná un archivo');
    try {
      await uploadImage(productId, imgFile, imgAlt.trim() || undefined);
      setImgFile(null);
      setImgAlt('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadImages(productId);
      await refreshProducts(); // <--- refresca la lista
    } catch {
      setImgError('Error al subir la imagen');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta imagen?')) return;
    try {
      await deleteImage(productId, id);
      loadImages(productId);
      await refreshProducts(); // <--- refresca la lista
    } catch {
      setImgError('Error al eliminar la imagen');
    }
  };

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Imágenes del producto</h3>
        <div className={styles.uploadRow}>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={e => setImgFile(e.target.files?.[0] || null)} 
          />
          <input 
            type="text" 
            placeholder="Texto alternativo" 
            value={imgAlt} 
            onChange={e => setImgAlt(e.target.value)} 
          />
          <button type="button" onClick={handleUpload}>Subir imagen</button>
        </div>
        
        {imgError && <div className={styles.error}>{imgError}</div>}
        
        {isLoading ? (
          <div>Cargando imágenes...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={styles.imagesGrid}>
            {images.length === 0 && <div>No hay imágenes para este producto.</div>}
            {images.map(img => (
              <div key={img.id} className={styles.imageItem}>
                <img src={img.url} alt={img.altText || ''} className={styles.image} />
                <div className={styles.imageActions}>
                  <button type="button" onClick={() => handleDelete(img.id)}>Eliminar</button>
                  {img.altText && <span className={styles.altText}>Alt: {img.altText}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}