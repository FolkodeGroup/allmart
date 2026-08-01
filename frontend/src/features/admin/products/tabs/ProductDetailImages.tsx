import { useState, useRef, useEffect } from 'react';
import { useAdminImages } from '../../../../context/AdminImagesContext';
import { useAdminProducts } from '../../../../context/useAdminProductsContext';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
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
    <div className={`${styles.container} imagesContainerResponsive`}>
      <style>{`
        @media (max-width: 767px) {
          .imagesContainerResponsive {
            padding: 4px 0 !important;
          }
          .dropzoneBox {
            border: 2px dashed var(--color-border, #e5e2dd);
            border-radius: 12px;
            padding: 16px;
            text-align: center;
            background: var(--color-bg-secondary, #f8f9fa);
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
          }
          .dropzoneText {
            font-size: 13px;
            font-weight: 600;
            color: var(--color-primary, #769282);
          }
          .dropzoneHint {
            font-size: 11px;
            color: var(--color-text-secondary, #6b7280);
          }
          .imagesGridMobile {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .mobileImageCard {
            position: relative;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid var(--color-border, #e5e2dd);
            background: #fff;
            aspect-ratio: 1 / 1;
          }
          .mobileImageCard img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .mobileDeleteBtn {
            position: absolute;
            top: 6px;
            right: 6px;
            min-width: 36px;
            min-height: 36px;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.9);
            color: #fff;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
        }
      `}</style>

      {/* Zona de subida (Dropzone táctil) */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Cargar nueva imagen</h3>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={e => setImgFile(e.target.files?.[0] || null)}
        />

        <div
          className="dropzoneBox"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
        >
          <ImageIcon size={28} style={{ color: 'var(--color-primary)' }} />
          <span className="dropzoneText">
            {imgFile ? imgFile.name : 'Tocá para seleccionar una imagen'}
          </span>
          <span className="dropzoneHint">Soporta JPG, PNG, WebP (máx. 5 MB)</span>
        </div>

        {imgFile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
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
              disabled={uploading}
              style={{ minHeight: '44px', width: '100%', justifyContent: 'center' }}
            >
              <Upload size={16} />
              {uploading ? 'Subiendo...' : 'Subir imagen'}
            </button>
          </div>
        )}

        {imgError && <div className={styles.error}>{imgError}</div>}
      </section>

      {/* Galería de imágenes */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Galería ({images.length})</h3>

        {isLoading ? (
          <div className={styles.info}>Cargando imágenes...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : images.length === 0 ? (
          <div className={styles.info}>No hay imágenes para este producto.</div>
        ) : (
          <div className={`${styles.imagesGrid} imagesGridMobile`}>
            {images.map(img => (
              <div key={img.id} className="mobileImageCard">
                <img src={img.url} alt={img.altText || ''} />
                <button
                  type="button"
                  className="mobileDeleteBtn"
                  onClick={() => handleDelete(img.id)}
                  title="Eliminar imagen"
                  aria-label="Eliminar imagen"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}