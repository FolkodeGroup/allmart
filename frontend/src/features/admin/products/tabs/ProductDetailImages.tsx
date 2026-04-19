import { useState, useRef, useEffect } from 'react';
import { useAdminImages } from '../../../../context/AdminImagesContext';
import { useAdminProducts } from '../../../../context/useAdminProductsContext';
import { Upload, Trash2 } from 'lucide-react';
import styles from './ProductDetailImages.module.css';

interface ProductDetailImagesProps {
  productId: string;
}

export function ProductDetailImages({ productId }: ProductDetailImagesProps) {
  const { images, isLoading, error, uploadImage, deleteImage, loadImages } = useAdminImages();
  const { refreshCurrentPage } = useAdminProducts();
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgAlt, setImgAlt] = useState('');
  const [imgError, setImgError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    loadImages(productId); 
  }, [productId, loadImages]); 

  const handleUpload = async () => {
    setImgError('');
    if (!imgFile) return setImgError('Seleccioná un archivo');
    setUploading(true);
    try {
      await uploadImage(productId, imgFile, imgAlt.trim() || undefined);
      setImgFile(null);
      setImgAlt('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadImages(productId);
      await refreshCurrentPage();
    } catch {
      setImgError('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta imagen?')) return;
    try {
      await deleteImage(productId, id);
      loadImages(productId);
      await refreshCurrentPage();
    } catch {
      setImgError('Error al eliminar la imagen');
    }
  };

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Imágenes del producto</h3>

        {/* Upload row */}
        <div className={styles.uploadRow}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={e => setImgFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            className={styles.selectBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            Seleccionar archivo
          </button>
          <span className={styles.fileName}>
            {imgFile ? imgFile.name : 'Ningún archivo seleccionado'}
          </span>
        </div>

        <input
          type="text"
          placeholder="Texto alternativo (opcional)"
          value={imgAlt}
          onChange={e => setImgAlt(e.target.value)}
          className={styles.altInput}
        />

        <button
          type="button"
          className={styles.uploadBtn}
          onClick={handleUpload}
          disabled={!imgFile || uploading}
        >
          <Upload size={14} />
          {uploading ? 'Subiendo...' : 'Subir imagen'}
        </button>

        {imgError && <div className={styles.error}>{imgError}</div>}
      </section>

      {/* Images grid */}
      <section className={styles.section}>
        {isLoading ? (
          <div className={styles.info}>Cargando imágenes...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : images.length === 0 ? (
          <div className={styles.info}>No hay imágenes para este producto.</div>
        ) : (
          <div className={styles.imagesGrid}>
            {images.map(img => (
              <div key={img.id} className={styles.imageItem}>
                <img src={img.url} alt={img.altText || ''} className={styles.image} />
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(img.id)}
                  title="Eliminar imagen"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}