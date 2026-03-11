import { useState, useRef, useEffect } from 'react';
import type { AdminProduct } from '../../../context/AdminProductsContext';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import { useAdminImages } from '../../../context/AdminImagesContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import sectionStyles from './AdminSection.module.css';
import styles from './AdminImages.module.css';

export function AdminImages() {
  const { products } = useAdminProducts();
  const {
    images,
    selectedProductId,
    isLoading,
    error: apiError,
    loadImages,
    uploadImage,
    updateImageMeta,
    deleteImage,
  } = useAdminImages();
  const { can } = useAdminAuth();

  const [search, setSearch] = useState('');

  // ── Upload de archivo ──────────────────────────────────────────────────────
  const [isAdding, setIsAdding] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [newAltText, setNewAltText] = useState('');
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // ── Edición inline de altText ──────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAlt, setEditingAlt] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Enfocar el input de edición cuando se activa (sin autoFocus)
  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const selectedProduct: AdminProduct | undefined = selectedProductId
    ? products.find(p => p.id === selectedProductId)
    : undefined;

  // ── Selección de producto ──────────────────────────────────────────────────

  const handleSelectProduct = async (productId: string) => {
    if (productId === selectedProductId) return;
    setEditingId(null);
    setIsAdding(false);
    resetUploadForm();
    await loadImages(productId);
  };

  // ── Upload helpers ─────────────────────────────────────────────────────────

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadPreview(null);
    setNewAltText('');
    setUploadProgress('idle');
    setIsAdding(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    const objectUrl = URL.createObjectURL(file);
    setUploadPreview(objectUrl);
    setUploadProgress('idle');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploadFile(file);
    const objectUrl = URL.createObjectURL(file);
    setUploadPreview(objectUrl);
    setUploadProgress('idle');
  };

  const handleUpload = async () => {
    if (!uploadFile || !selectedProductId) return;
    setUploadProgress('uploading');
    try {
      await uploadImage(selectedProductId, uploadFile, newAltText.trim() || undefined);
      setUploadProgress('done');
      setTimeout(resetUploadForm, 1200);
    } catch {
      setUploadProgress('error');
    }
  };

  // ── Edición inline de altText ──────────────────────────────────────────────

  const startEdit = (id: string, altText?: string | null) => {
    setEditingId(id);
    setEditingAlt(altText ?? '');
  };

  const commitEdit = async (productId: string, imageId: string) => {
    setSavingId(imageId);
    try {
      await updateImageMeta(productId, imageId, { altText: editingAlt.trim() || null });
      setEditingId(null);
    } catch {
      // error en contexto
    } finally {
      setSavingId(null);
    }
  };

  // ── Eliminar imagen ────────────────────────────────────────────────────────

  const handleDelete = async (imageId: string) => {
    if (!selectedProductId || !window.confirm('¿Eliminar esta imagen?')) return;
    setDeletingId(imageId);
    try {
      await deleteImage(selectedProductId, imageId);
    } catch {
      // error en contexto
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={`${sectionStyles.page} ${styles.widePage}`}>
      <div className={sectionStyles.header}>
        <span className={sectionStyles.label}>Administración</span>
        <h1 className={sectionStyles.title}>
          <span>🖼️</span> Imágenes de producto
        </h1>
        <p className={sectionStyles.subtitle}>
          Subí imágenes desde tu dispositivo — el backend las convierte a WebP y genera miniatura automáticamente.
        </p>
      </div>

      <div className={styles.layout}>
        {/* ── Panel izquierdo: selector de producto ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>Productos</span>
            <span className={styles.productCount}>{filtered.length}</span>
          </div>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <ul role="listbox" aria-label="Seleccionar producto" className={styles.productList}>
            {filtered.length === 0 && (
              <li className={styles.emptyList}>Sin resultados</li>
            )}
            {filtered.map(p => {
              const count = selectedProductId === p.id ? images.length : 0;
              return (
                <li
                  key={p.id}
                  role="option"
                  aria-selected={selectedProductId === p.id}
                  tabIndex={0}
                  className={`${styles.productItem} ${selectedProductId === p.id ? styles.selected : ''}`}
                  onClick={() => handleSelectProduct(p.id)}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleSelectProduct(p.id)}
                >
                  <div className={styles.productName}>{p.name}</div>
                  {p.sku && <div className={styles.productSku}>{p.sku}</div>}
                  <div className={styles.productMeta}>
                    {selectedProductId === p.id ? (
                      count === 0
                        ? <span className={styles.noImages}>Sin imágenes</span>
                        : <span className={styles.imageBadge}>{count} imagen{count !== 1 ? 'es' : ''}</span>
                    ) : (
                      <span className={styles.noImages}>Seleccioná para ver</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ── Panel derecho: gestión de imágenes ── */}
        <main className={styles.content}>
          {!selectedProduct ? (
            <div className={sectionStyles.emptyState}>
              <div className={sectionStyles.emptyIcon}>🖼️</div>
              <p className={sectionStyles.emptyText}>Seleccioná un producto para gestionar sus imágenes</p>
            </div>
          ) : isLoading && images.length === 0 ? (
            <div className={sectionStyles.emptyState}>
              <p className={sectionStyles.emptyText}>Cargando imágenes...</p>
            </div>
          ) : (
            <>
              {apiError && (
                <p className={styles.errorMsg}>Error: {apiError}</p>
              )}

              <div className={styles.contentHeader}>
                <div>
                  <h2 className={styles.contentTitle}>{selectedProduct.name}</h2>
                  {selectedProduct.sku && (
                    <span className={styles.contentSku}>SKU: {selectedProduct.sku}</span>
                  )}
                </div>
                <span className={styles.imageCount}>
                  {images.length} imagen{images.length !== 1 ? 'es' : ''}
                </span>
              </div>

              {/* Grid de imágenes existentes */}
              {images.length > 0 && (
                <div className={styles.imageGrid}>
                  {images.map(img => (
                    <div key={img.id} className={styles.imageCard}>
                      {/* Miniatura servida desde el backend (WebP binario en DB) */}
                      <div className={styles.thumbnail}>
                        <img
                          src={img.thumbUrl ?? img.url}
                          alt={img.altText ?? `Imagen ${img.position + 1}`}
                          className={styles.thumbImg}
                          onError={e => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="140" height="100"><rect fill="%23eee" width="140" height="100"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="%23999" font-size="12">Sin imagen</text></svg>';
                          }}
                        />
                        <span className={styles.positionBadge}>#{img.position + 1}</span>
                        {img.sizeBytes && (
                          <span className={styles.sizeBadge}>
                            {(img.sizeBytes / 1024).toFixed(0)} KB
                          </span>
                        )}
                      </div>

                      {/* Detalle / edición de altText */}
                      {editingId === img.id ? (
                        <div className={styles.cardEdit}>
                          <input
                            className={styles.editInput}
                            value={editingAlt}
                            onChange={e => setEditingAlt(e.target.value)}
                            placeholder="Texto alternativo (alt)"
                            ref={editInputRef}
                            onKeyDown={e => {
                              if (e.key === 'Enter') commitEdit(selectedProductId!, img.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <div className={styles.cardActions}>
                            <button
                              className={styles.saveBtn}
                              onClick={() => commitEdit(selectedProductId!, img.id)}
                              disabled={savingId === img.id}
                              type="button"
                            >
                              {savingId === img.id ? '...' : 'Guardar'}
                            </button>
                            <button
                              className={styles.cancelEditBtn}
                              onClick={() => setEditingId(null)}
                              type="button"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.cardInfo}>
                          {img.altText && (
                            <p className={styles.cardAlt}>{img.altText}</p>
                          )}
                          {img.width && img.height && (
                            <p className={styles.cardDims}>{img.width} × {img.height} px</p>
                          )}
                          <div className={styles.cardActions}>
                            {can('products.edit') && (
                              <button
                                className={styles.editBtn}
                                onClick={() => startEdit(img.id, img.altText)}
                                type="button"
                              >
                                Editar alt
                              </button>
                            )}
                            {can('products.delete') && (
                              <button
                                className={styles.deleteBtn}
                                onClick={() => handleDelete(img.id)}
                                disabled={deletingId === img.id}
                                type="button"
                              >
                                {deletingId === img.id ? '...' : 'Eliminar'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Sin imágenes */}
              {!isLoading && images.length === 0 && (
                <div className={styles.noImagesMsg}>
                  <p>Este producto no tiene imágenes. Subí la primera imagen abajo.</p>
                </div>
              )}

              {/* Zona de upload */}
              {can('products.create') && (
                <div className={styles.addSection}>
                  {!isAdding ? (
                    <button
                      className={styles.addImageBtn}
                      onClick={() => setIsAdding(true)}
                      type="button"
                    >
                      + Subir imagen
                    </button>
                  ) : (
                    <div className={styles.addForm}>
                      <h3 className={styles.addFormTitle}>Subir nueva imagen</h3>

                      {/* Zona drag & drop */}
                      <div
                        role="button"
                        tabIndex={0}
                        className={`${styles.dropZone} ${uploadPreview ? styles.dropZoneHasFile : ''}`}
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
                      >
                        {uploadPreview ? (
                          <img
                            src={uploadPreview}
                            alt="Vista previa"
                            className={styles.dropPreview}
                          />
                        ) : (
                          <>
                            <span className={styles.dropIcon}>📁</span>
                            <p className={styles.dropText}>
                              Arrastrá una imagen aquí o hacé clic para seleccionarla
                            </p>
                            <p className={styles.dropHint}>JPEG, PNG, WebP, GIF — máx. 8 MB</p>
                          </>
                        )}
                      </div>

                      {/* Input oculto */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
                        className={styles.hiddenFileInput}
                        onChange={handleFileChange}
                      />

                      {uploadFile && (
                        <p className={styles.fileName}>
                          📎 {uploadFile.name} ({(uploadFile.size / 1024).toFixed(0)} KB)
                        </p>
                      )}

                      <input
                        className={styles.editInput}
                        value={newAltText}
                        onChange={e => setNewAltText(e.target.value)}
                        placeholder="Texto alternativo (opcional)"
                      />

                      {/* Estado de upload */}
                      {uploadProgress === 'uploading' && (
                        <p className={styles.uploadStatus}>⏳ Convirtiendo a WebP y guardando...</p>
                      )}
                      {uploadProgress === 'done' && (
                        <p className={`${styles.uploadStatus} ${styles.uploadOk}`}>✅ Imagen subida correctamente</p>
                      )}
                      {uploadProgress === 'error' && (
                        <p className={`${styles.uploadStatus} ${styles.uploadErr}`}>❌ Error al subir la imagen</p>
                      )}

                      <div className={styles.addFormActions}>
                        <button
                          className={styles.saveBtn}
                          onClick={handleUpload}
                          disabled={!uploadFile || uploadProgress === 'uploading'}
                          type="button"
                        >
                          {uploadProgress === 'uploading' ? 'Subiendo...' : 'Subir imagen'}
                        </button>
                        <button
                          className={styles.cancelEditBtn}
                          onClick={resetUploadForm}
                          type="button"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
