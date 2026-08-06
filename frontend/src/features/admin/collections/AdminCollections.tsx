/**
 * features/admin/collections/AdminCollections.tsx
 * Página principal de gestión de colecciones.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Collection } from './collectionsService';
import { collectionsService } from './collectionsService';
import AdminCollectionForm from './AdminCollectionForm';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import styles from './AdminCollections.module.css';
import { AdminPagination } from '../../../components/ui/AdminPagination/AdminPagination';
import { Search } from 'lucide-react';
import { Dropdown } from '../../../components/ui/Dropdown/Dropdown';
import CollectionPreview from '../../../components/CollectionPreview/CollectionPreview';
import ImageWithFallback from '../../../components/ui/ImageWithFallback';
import { resolveImageUrl } from '../../../utils/imageHelpers';
import { normalizeImageUrl, getFirstProductImage } from '../../../utils/imageUrl';

type ViewMode = 'list' | 'form';

const AdminCollections: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>();
  const [displayPosition, setDisplayPosition] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [idsToDelete, setIdsToDelete] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewCollection, setPreviewCollection] = useState<Collection | null>(null);
  const [previewAnchor, setPreviewAnchor] = useState<DOMRect | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const limit = 10;

  useEffect(() => {
    loadCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filterActive, displayPosition]);

  useEffect(() => {
    if (!collections || collections.length === 0) return;
    const missing = collections.filter((c) => !c.products || c.products.length === 0);
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      for (const c of missing) {
        try {
          const full = await collectionsService.getById(c.id);
          if (cancelled) return;
          setCollections((prev) => prev.map((p) => (p.id === full.id ? full : p)));
        } catch {
          // ignore
        }
      }
    })();

    return () => { cancelled = true; };
  }, [collections]);

  async function loadCollections() {
    setLoading(true);
    setError(null);
    try {
      const result = await collectionsService.getAll(
        page,
        limit,
        search,
        displayPosition,
        filterActive
      );
      setCollections(result.data);
      setPages(result.pagination.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando colecciones');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!openMenuId) return;
      const el = (e.target as HTMLElement);
      if (!el.closest) return;
      if (el.closest(`[data-menu-id="${openMenuId}"]`) || el.closest(`[data-btn-id="${openMenuId}"]`)) {
        return;
      }
      setOpenMenuId(null);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [openMenuId]);

  useEffect(() => {
    if (openMenuId && menuFirstItemRef.current) {
      menuFirstItemRef.current.focus();
    }
  }, [openMenuId]);
  const menuFirstItemRef = useRef<HTMLDivElement | null>(null);

  async function toggleActive(collection: Collection) {
    const id = collection.id;
    const next = !collection.isActive;
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: next } : c)));
    try {
      await collectionsService.update(id, { isActive: next });
    } catch (err) {
      setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: collection.isActive } : c)));
      setError(err instanceof Error ? err.message : 'Error cambiando estado');
    }
  }

  function handleDelete(id: string) {
    setIdsToDelete([id]);
    setDeleteModalOpen(true);
  }

  function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    setIdsToDelete([...selectedIds]);
    setDeleteModalOpen(true);
  }

  async function handleConfirmDelete() {
    if (!idsToDelete.length) return;
    setDeleting(true);
    setError(null);
    try {
      await Promise.all(idsToDelete.map((id) => collectionsService.delete(id)));
      setDeleteModalOpen(false);
      setIdsToDelete([]);
      setSelectedIds([]);
      await loadCollections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando colección(es)');
    } finally {
      setDeleting(false);
    }
  }

  function handleCancelDelete() {
    setDeleteModalOpen(false);
    setIdsToDelete([]);
    setDeleting(false);
  }

  function handleEdit(collection: Collection) {
    setSelectedCollection(collection);
    setViewMode('form');
  }

  function handleNew() {
    setSelectedCollection(null);
    setViewMode('form');
  }

  function handleFormSubmit() {
    setViewMode('list');
    loadCollections();
  }

  function handleFormCancel() {
    setViewMode('list');
  }

  const positionOptions = useMemo(() => [
    { value: '', label: 'Todas las posiciones' },
    { value: 'home', label: 'Home' },
    { value: 'category', label: 'Categoría' }
  ], []);

  const activeOptions = useMemo(() => [
    { value: '', label: 'Todas las de estado' },
    { value: 'true', label: 'Activas' },
    { value: 'false', label: 'Inactivas' }
  ], []);

  if (viewMode === 'form') {
    return (
      <AdminCollectionForm
        collection={selectedCollection}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
          {selectedIds.length > 0 && (
            <button
              className={styles.btnSmallDanger}
              onClick={handleBulkDelete}
              disabled={deleting}
              style={{ marginRight: 8 }}
            >
              Eliminar seleccionadas ({selectedIds.length})
            </button>
          )}
          <button className={styles.btnPrimary} onClick={handleNew}>
            + Nueva Colección
          </button>
        </div>
      </div>

      <div className={styles.filters} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar colecciones..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={styles.searchInput}
            autoComplete="off"
            spellCheck="false"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>

        <div style={{ flex: '1 1 180px', minWidth: '180px', maxWidth: '240px' }}>
          <Dropdown
            options={positionOptions}
            value={displayPosition}
            onChange={(val) => {
              setDisplayPosition(val);
              setPage(1);
            }}
            placeholder="Todas las posiciones"
          />
        </div>

        <div style={{ flex: '1 1 150px', minWidth: '150px', maxWidth: '200px' }}>
          <Dropdown
            options={activeOptions}
            value={filterActive === undefined ? '' : filterActive ? 'true' : 'false'}
            onChange={(val) => {
              setFilterActive(
                val === '' ? undefined : val === 'true'
              );
              setPage(1);
            }}
            placeholder="Todas"
          />
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Cargando...</div>
        ) : collections.length === 0 ? (
          <div className={styles.empty}>No hay colecciones</div>
        ) : (
          <div className={styles.collectionsGrid}>
            {collections
              .slice()
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((collection) => {
                const checked = selectedIds.includes(collection.id);
                return (
                  <div key={collection.id} className={styles.collectionCard}>
                    <div className={styles.collectionCardHeader}>
                      <div className={styles.cardCheckbox}>
                        <input
                          type="checkbox"
                          aria-label={`Seleccionar colección ${collection.name}`}
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, collection.id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== collection.id));
                            }
                          }}
                        />
                        <div className={styles.collectionOrder}>{collection.displayOrder}</div>
                      </div>

                      <button
                        type="button"
                        className={styles.collectionCardTitle}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setPreviewAnchor(rect);
                          setPreviewLoading(true);
                          collectionsService.getById(collection.id)
                            .then((full) => setPreviewCollection(full))
                            .catch(() => setPreviewCollection(null))
                            .finally(() => setPreviewLoading(false));
                        }}
                        title="Ver previsualización"
                      >
                        {collection.name}
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={collection.type === 'auto_sales' ? styles.badgeAuto : styles.badgeManual}>
                          {collection.type === 'auto_sales' ? 'Auto ventas' : 'Manual'}
                        </span>
                        <button
                          className={`${styles.actionBtn} actionBtn`}
                          data-btn-id={collection.id}
                          onClick={() => setOpenMenuId((prev) => (prev === collection.id ? null : collection.id))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setOpenMenuId((prev) => (prev === collection.id ? null : collection.id));
                            }
                          }}
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === collection.id}
                          aria-controls={`action-menu-${collection.id}`}
                          aria-label="Más acciones"
                          title="Acciones"
                        >
                          ⋮
                        </button>
                        {openMenuId === collection.id && (
                          <div
                            id={`action-menu-${collection.id}`}
                            className={`${styles.actionMenu} actionMenu`}
                            data-menu-id={collection.id}
                            role="menu"
                          >
                            <div
                              ref={menuFirstItemRef}
                              role="menuitem"
                              tabIndex={0}
                              className={styles.actionMenuItem}
                              onClick={() => { setOpenMenuId(null); handleEdit(collection); }}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleEdit(collection); setOpenMenuId(null); } }}
                            >
                              Editar
                            </div>
                            <div
                              role="menuitem"
                              tabIndex={0}
                              className={styles.actionMenuItem}
                              onClick={() => { setOpenMenuId(null); handleDelete(collection.id); }}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleDelete(collection.id); setOpenMenuId(null); } }}
                            >
                              Eliminar
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {(() => {
                      const img = normalizeImageUrl(collection.imageUrl) || getFirstProductImage(collection.products?.[0]);
                      if (img) {
                        const candidates: (string | undefined | null)[] = [];
                        if (collection.products && collection.products.length) {
                          const firstProdImg = getFirstProductImage(collection.products[0]);
                          if (firstProdImg) {
                            const prResolved = resolveImageUrl(firstProdImg);
                            if (prResolved && prResolved !== firstProdImg) candidates.push(prResolved);
                            candidates.push(firstProdImg);
                          }
                        }

                        const resolved = resolveImageUrl(img);
                        if (resolved && resolved !== img) candidates.push(resolved);
                        candidates.push(img);

                        return (
                          <ImageWithFallback
                            srcCandidates={candidates}
                            alt={collection.name}
                            className={styles.collectionCardImage}
                          />
                        );
                      }
                      return <div className={styles.collectionCardImagePlaceholder}>Sin imagen</div>;
                    })()}

                    {collection.description && (
                      <div className={styles.description}>{collection.description}</div>
                    )}

                    <div className={styles.collectionCardMeta}>
                      <div>{collection.productCount} productos</div>
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleActive(collection)}
                          className={collection.isActive ? styles.badgeActive : styles.badgeInactive}
                          aria-pressed={collection.isActive}
                          style={{ cursor: 'pointer', border: 'none' }}
                          title={collection.isActive ? 'Desactivar colección' : 'Activar colección'}
                        >
                          {collection.isActive ? 'Activa' : 'Inactiva'}
                        </button>
                      </div>
                    </div>

                    <div className={styles.collectionProductsPreview}>
                      {(collection.products || []).slice(0, 4).map((p) => (
                        <ImageWithFallback
                          key={p.id}
                          srcCandidates={[getFirstProductImage(p)]}
                          alt={p.name}
                          className={styles.collectionProductMini}
                          placeholder=""
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {previewCollection && previewAnchor && !previewLoading && (
        <CollectionPreview
          collection={previewCollection}
          anchorRect={previewAnchor}
          onClose={() => {
            setPreviewCollection(null);
            setPreviewAnchor(null);
          }}
        />
      )}

      {pages > 1 && (
        <AdminPagination
          page={page}
          totalPages={pages}
          onPageChange={setPage}
          ariaLabel="Paginación de colecciones"
        />
      )}

      <ConfirmModal
        open={deleteModalOpen}
        title={idsToDelete.length > 1 ? 'Eliminar Colecciones' : 'Eliminar Colección'}
        message={
          idsToDelete.length > 1
            ? `¿Está seguro de que desea eliminar estas ${idsToDelete.length} colecciones? Esta acción no se puede deshacer.`
            : '¿Está seguro de que desea eliminar esta colección? Esta acción no se puede deshacer.'
        }
        confirmLabel={deleting ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleting}
      />
    </div>
  );
};

export default AdminCollections;