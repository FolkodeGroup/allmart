import { useState, useRef } from 'react';
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
    addImage,
    updateImage,
    deleteImage,
  } = useAdminImages();
  const { can } = useAdminAuth();

  const [search, setSearch] = useState('');
  // Estado para el formulario de nueva imagen
  const [newUrl, setNewUrl] = useState('');
  const [newAltText, setNewAltText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  // Estado para edición inline de url/altText
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState('');
  const [editingAlt, setEditingAlt] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const addUrlRef = useRef<HTMLInputElement>(null);

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
    setNewUrl('');
    setNewAltText('');
    await loadImages(productId);
  };

  // ── Agregar imagen ─────────────────────────────────────────────────────────

  const handleAddImage = async () => {
    const url = newUrl.trim();
    if (!url || !selectedProductId) return;
    try {
      await addImage(selectedProductId, { url, altText: newAltText.trim() || undefined });
      setNewUrl('');
      setNewAltText('');
      setIsAdding(false);
    } catch {
      // error ya guardado en contexto
    }
  };

  // ── Edición inline ─────────────────────────────────────────────────────────

  const startEdit = (id: string, url: string, altText?: string) => {
    setEditingId(id);
    setEditingUrl(url);
    setEditingAlt(altText ?? '');
  };

  const commitEdit = async (imageId: string) => {
    const url = editingUrl.trim();
    if (!url || !selectedProductId) return;
    setSavingId(imageId);
    try {
      await updateImage(selectedProductId, imageId, {
        url,
        altText: editingAlt.trim() || undefined,
      });
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
          Gestioná las imágenes de cada producto: subí, editá URLs y eliminá imágenes vía API.
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
          <ul className={styles.productList}>
            {filtered.length === 0 && (
              <li className={styles.emptyList}>Sin resultados</li>
            )}
            {filtered.map(p => {
              const count = selectedProductId === p.id ? images.length : 0;
              return (
                <li
                  key={p.id}
                  className={`${styles.productItem} ${selectedProductId === p.id ? styles.selected : ''}`}
                  onClick={() => handleSelectProduct(p.id)}
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
                      {/* Thumbnail */}
                      <div className={styles.thumbnail}>
                        {img.url ? (
                          <img
                            src={img.url}
                            alt={img.altText ?? img.url}
                            className={styles.thumbImg}
                            onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/140x100?text=Error'; }}
                          />
                        ) : (
                          <div className={styles.thumbPlaceholder}>Sin imagen</div>
                        )}
                        <span className={styles.positionBadge}>#{img.position + 1}</span>
                      </div>

                      {/* Detalle / edición */}
                      {editingId === img.id ? (
                        <div className={styles.cardEdit}>
                          <input
                            className={styles.editInput}
                            value={editingUrl}
                            onChange={e => setEditingUrl(e.target.value)}
                            placeholder="URL de la imagen"
                            onKeyDown={e => e.key === 'Enter' && commitEdit(img.id)}
                          />
                          <input
                            className={styles.editInput}
                            value={editingAlt}
                            onChange={e => setEditingAlt(e.target.value)}
                            placeholder="Texto alternativo (alt)"
                            onKeyDown={e => e.key === 'Enter' && commitEdit(img.id)}
                          />
                          <div className={styles.cardActions}>
                            <button
                              className={styles.saveBtn}
                              onClick={() => commitEdit(img.id)}
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
                          <p className={styles.cardUrl} title={img.url}>{img.url}</p>
                          {img.altText && (
                            <p className={styles.cardAlt}>{img.altText}</p>
                          )}
                          <div className={styles.cardActions}>
                            {can('products.edit') && (
                              <button
                                className={styles.editBtn}
                                onClick={() => startEdit(img.id, img.url, img.altText)}
                                type="button"
                              >
                                Editar
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
                  <p>Este producto no tiene imágenes. Agregá la primera imagen abajo.</p>
                </div>
              )}

              {/* Formulario para agregar nueva imagen */}
              {can('products.create') && (
                <div className={styles.addSection}>
                  {!isAdding ? (
                    <button
                      className={styles.addImageBtn}
                      onClick={() => {
                        setIsAdding(true);
                        setTimeout(() => addUrlRef.current?.focus(), 50);
                      }}
                      type="button"
                    >
                      + Agregar imagen
                    </button>
                  ) : (
                    <div className={styles.addForm}>
                      <h3 className={styles.addFormTitle}>Nueva imagen</h3>
                      <input
                        ref={addUrlRef}
                        className={styles.editInput}
                        value={newUrl}
                        onChange={e => setNewUrl(e.target.value)}
                        placeholder="URL de la imagen *"
                        onKeyDown={e => e.key === 'Enter' && handleAddImage()}
                      />
                      <input
                        className={styles.editInput}
                        value={newAltText}
                        onChange={e => setNewAltText(e.target.value)}
                        placeholder="Texto alternativo (opcional)"
                        onKeyDown={e => e.key === 'Enter' && handleAddImage()}
                      />
                      <div className={styles.addFormActions}>
                        <button
                          className={styles.saveBtn}
                          onClick={handleAddImage}
                          disabled={!newUrl.trim() || isLoading}
                          type="button"
                        >
                          {isLoading ? 'Agregando...' : 'Agregar imagen'}
                        </button>
                        <button
                          className={styles.cancelEditBtn}
                          onClick={() => { setIsAdding(false); setNewUrl(''); setNewAltText(''); }}
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
