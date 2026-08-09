import { useState, useRef, useEffect } from 'react';
import { useAdminImages } from '../../../../context/AdminImagesContext';
import { useAdminProducts } from '../../../../context/useAdminProductsContext';
import { Upload, Trash2, Image as ImageIcon, Star } from 'lucide-react';


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
    <div className="flatImagesContainer">
      <style>{`
        .flatImagesContainer {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
          box-sizing: border-box;
          padding: 0 !important;
        }

        .sectionTitleFlat {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-secondary, #9ca3af);
          border-bottom: 1px solid var(--color-border, rgba(229, 226, 221, 0.15));
          padding-bottom: 8px;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Dropzone estilizado */
        .dropzoneDashed {
          border: 2px dashed var(--color-border, #374151);
          border-radius: 12px;
          padding: 24px 16px;
          text-align: center;
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .dropzoneDashed:hover {
          border-color: var(--color-primary, #769282);
          background: rgba(118, 146, 130, 0.06);
        }

        .dropzoneTitle {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-primary, #ffffff);
        }

        .dropzoneSub {
          font-size: 12px;
          color: var(--color-text-secondary, #9ca3af);
        }

        /* Formulario flotante de carga */
        .uploadFormBox {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 12px;
        }

        .altInputFlat {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--color-border, #374151);
          background: var(--color-bg-primary, #111827);
          color: var(--color-text-primary, #ffffff);
          font-size: 14px;
          box-sizing: border-box;
        }

        .uploadSubmitBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          padding: 0 20px;
          border-radius: 8px;
          background: var(--color-primary, #769282);
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .uploadSubmitBtn:hover:not(:disabled) {
          background: var(--color-primary-dark, #5d7568);
        }

        /* Grilla de imágenes responsiva */
        .galleryGridFlat {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        @media (min-width: 640px) {
          .galleryGridFlat {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }
        }

        @media (min-width: 1024px) {
          .galleryGridFlat {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .galleryCardFlat {
          position: relative;
          aspect-ratio: 1 / 1;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid var(--color-border, rgba(229, 226, 221, 0.15));
          background: var(--color-bg-secondary, #1f2937);
        }

        .galleryImgFlat {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .primaryBadgeFlat {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(16, 185, 129, 0.9);
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .deleteOverlayBtn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.9);
          color: #ffffff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.15s ease;
        }

        .deleteOverlayBtn:hover {
          background: #dc2626;
          transform: scale(1.05);
        }

        .errorTextFlat {
          color: #ef4444;
          font-size: 13px;
          font-weight: 500;
        }

        .infoTextFlat {
          color: var(--color-text-secondary, #9ca3af);
          font-size: 13px;
        }
      `}</style>

      {/* Cargar nueva imagen */}
      <div>
        <h3 className="sectionTitleFlat">
          <Upload size={14} /> Cargar nueva imagen
        </h3>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={e => setImgFile(e.target.files?.[0] || null)}
        />

        <div
          className="dropzoneDashed"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
        >
          <ImageIcon size={32} style={{ color: 'var(--color-primary, #769282)' }} />
          <span className="dropzoneTitle">
            {imgFile ? imgFile.name : 'Tocá o arrastrá para seleccionar una imagen'}
          </span>
          <span className="dropzoneSub">Soporta JPG, PNG, WebP (máx. 5 MB)</span>
        </div>

        {imgFile && (
          <div className="uploadFormBox">
            <input
              type="text"
              placeholder="Texto alternativo (opcional)"
              value={imgAlt}
              onChange={e => setImgAlt(e.target.value)}
              className="altInputFlat"
            />

            <button
              type="button"
              className="uploadSubmitBtn"
              onClick={handleUpload}
              disabled={uploading}
            >
              <Upload size={16} />
              {uploading ? 'Subiendo...' : 'Subir imagen'}
            </button>
          </div>
        )}

        {imgError && <div className="errorTextFlat" style={{ marginTop: '8px' }}>{imgError}</div>}
      </div>

      {/* Galería de imágenes */}
      <div>
        <h3 className="sectionTitleFlat">
          <ImageIcon size={14} /> Galería ({images.length})
        </h3>

        {isLoading ? (
          <div className="infoTextFlat">Cargando imágenes...</div>
        ) : error ? (
          <div className="errorTextFlat">{error}</div>
        ) : images.length === 0 ? (
          <div className="infoTextFlat">No hay imágenes cargadas para este producto.</div>
        ) : (
          <div className="galleryGridFlat">
            {images.map((img, index) => (
              <div key={img.id} className="galleryCardFlat">
                <img src={img.url} alt={img.altText || ''} className="galleryImgFlat" />
                {index === 0 && (
                  <span className="primaryBadgeFlat">
                    <Star size={10} fill="currentColor" /> Principal
                  </span>
                )}
                <button
                  type="button"
                  className="deleteOverlayBtn"
                  onClick={() => handleDelete(img.id)}
                  title="Eliminar imagen"
                  aria-label="Eliminar imagen"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}