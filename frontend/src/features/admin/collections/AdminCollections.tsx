/**
 * features/admin/collections/AdminCollections.tsx
 * Página principal de gestión de colecciones con vista Acordeón WYSIWYG.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Collection } from './collectionsService';
import { collectionsService } from './collectionsService';
import AdminCollectionForm from './AdminCollectionForm';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import CollectionSlider from '../../../components/CollectionSlider';
import { AdminPagination } from '../../../components/ui/AdminPagination/AdminPagination';
import { Search, Plus, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { Dropdown } from '../../../components/ui/Dropdown/Dropdown';
import toast from 'react-hot-toast';
import styles from './AdminCollections.module.css';

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
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  // Estado del Acordeón: id de la colección expandida (por defecto la primera)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const limit = 10;

  const loadCollections = useCallback(async () => {
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
  }, [page, limit, search, displayPosition, filterActive]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Al cargar o cambiar lista, expandir por defecto la primera colección
  useEffect(() => {
    if (collections.length > 0) {
      setExpandedId((prev) => {
        const exists = collections.some((c) => c.id === prev);
        return exists ? prev : collections[0].id;
      });
    } else {
      setExpandedId(null);
    }
  }, [collections]);

  // Cargar productos completos de cada colección si faltaran
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

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  async function toggleActive(collection: Collection, e?: React.MouseEvent) {
    e?.stopPropagation();
    const id = collection.id;
    const next = !collection.isActive;
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: next } : c)));
    try {
      await collectionsService.update(id, { isActive: next });
      toast.success(next ? 'Colección activada' : 'Colección desactivada');
    } catch (err) {
      setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: collection.isActive } : c)));
      setError(err instanceof Error ? err.message : 'Error cambiando estado');
    }
  }

  async function handleSyncSingle(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    setSyncingId(id);
    try {
      await collectionsService.sync(id);
      toast.success('Colección sincronizada con el top de ventas');
      await loadCollections();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al sincronizar');
    } finally {
      setSyncingId(null);
    }
  }

  async function handleSyncAll() {
    setSyncingAll(true);
    try {
      const res = await collectionsService.syncAll();
      toast.success(`Sincronizadas ${res.synced} colecciones`);
      await loadCollections();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al sincronizar colecciones');
    } finally {
      setSyncingAll(false);
    }
  }

  function handleDelete(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
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
      toast.success('Colección(es) eliminada(s) correctamente');
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

  function handleEdit(collection: Collection, e?: React.MouseEvent) {
    e?.stopPropagation();
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
    { value: '', label: 'Todos los estados' },
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
      {/* ── Acciones de Encabezado ── */}
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto', flexWrap: 'wrap' }}>
          {selectedIds.length > 0 && (
            <button
              type="button"
              className={styles.btnSmallDanger}
              onClick={handleBulkDelete}
              disabled={deleting}
            >
              Eliminar seleccionadas ({selectedIds.length})
            </button>
          )}
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleSyncAll}
            disabled={syncingAll}
            title="Sincronizar todas las colecciones automáticas por ventas"
          >
            <RotateCcw size={14} />
            {syncingAll ? 'Sincronizando...' : 'Sincronizar todo'}
          </button>
          <button type="button" className={styles.btnPrimary} onClick={handleNew}>
            <Plus size={16} />
            Nueva Colección
          </button>
        </div>
      </div>

      {/* ── Filtros ── */}
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

      {/* ── Vista Acordeón WYSIWYG de Colecciones ── */}
      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Cargando colecciones...</div>
        ) : collections.length === 0 ? (
          <div className={styles.empty}>No hay colecciones para mostrar.</div>
        ) : (
          <div className={styles.collectionsList}>
            {collections
              .slice()
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((collection) => {
                const checked = selectedIds.includes(collection.id);
                const isHome = collection.displayPosition === 'home';
                const isCategory = collection.displayPosition === 'category';
                const isAutoSales = collection.type === 'auto_sales';
                const isExpanded = expandedId === collection.id;

                return (
                  <div
                    key={collection.id}
                    className={`${styles.collectionAccordionCard} ${
                      isHome ? styles.cardHome : styles.cardCategory
                    }`}
                  >
                    {/* BARRA SUPERIOR CLICKABLE (CABECERA DEL ACORDEÓN) */}
                    <div
                      className={`${styles.cardHeaderClickable} ${
                        isExpanded ? styles.cardHeaderExpanded : ''
                      }`}
                      onClick={() => toggleExpand(collection.id)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleExpand(collection.id);
                        }
                      }}
                    >
                      <div className={styles.adminControlLeft}>
                        <span className={styles.expandChevron}>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </span>

                        <input
                          type="checkbox"
                          aria-label={`Seleccionar colección ${collection.name}`}
                          checked={checked}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, collection.id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== collection.id));
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={styles.adminCheckbox}
                        />

                        <span className={styles.orderBadge} title="Orden de visualización">
                          #{collection.displayOrder}
                        </span>

                        <h3 className={styles.collectionTitleText}>
                          {collection.name}
                        </h3>

                        <span
                          className={`${styles.positionBadge} ${
                            isHome ? styles.posHome : styles.posCategory
                          }`}
                        >
                          {isHome ? '🏠 Home' : '🏷️ Categoría'}
                        </span>

                        <span
                          className={`${styles.typeBadge} ${
                            isAutoSales ? styles.typeAuto : styles.typeManual
                          }`}
                        >
                          {isAutoSales ? '⚡ Auto ventas' : '📝 Manual'}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => toggleActive(collection, e)}
                          className={`${styles.statusBadge} ${
                            collection.isActive ? styles.statusActive : styles.statusInactive
                          }`}
                          title={collection.isActive ? 'Desactivar colección' : 'Activar colección'}
                        >
                          {collection.isActive ? '● Activa' : '○ Inactiva'}
                        </button>
                      </div>

                      <div className={styles.adminControlRight}>
                        {isAutoSales && (
                          <button
                            type="button"
                            className={styles.btnSync}
                            onClick={(e) => handleSyncSingle(collection.id, e)}
                            disabled={syncingId === collection.id}
                            title="Sincronizar productos top ventas"
                          >
                            {syncingId === collection.id ? '⟳ Sincronizando...' : '⟳ Sincronizar'}
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.btnEdit}
                          onClick={(e) => handleEdit(collection, e)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={styles.btnDelete}
                          onClick={(e) => handleDelete(collection.id, e)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {/* CUERPO WYSIWYG DESPLEGABLE (CUANDO ESTÁ EXPANDIDO) */}
                    {isExpanded && (
                      <div
                        className={`${styles.wysiwygContainer} ${
                          isHome ? styles.wysiwygHome : styles.wysiwygCategory
                        }`}
                      >
                        {/* Distintivo de tipo categoría en el cuerpo de la colección */}
                        {isCategory && (
                          <div className={styles.categoryDistinctiveBanner}>
                            <span className={styles.categoryDistinctiveTag}>
                              🏷️ COLECCIÓN DE CATEGORÍA
                            </span>
                            <span className={styles.categoryDistinctiveNote}>
                              Aparece destacada en la grilla/sección de categoría correspondiente
                            </span>
                          </div>
                        )}

                        {collection.products && collection.products.length > 0 ? (
                          <CollectionSlider
                            title={collection.name}
                            slug={collection.slug}
                            description={collection.description}
                            products={collection.products}
                            bannerUrl={collection.imageUrl}
                            previewMode={true}
                            showViewAll={true}
                            variant={collection.displayPosition}
                          />
                        ) : (
                          <div className={styles.wysiwygEmpty}>
                            <p>Sin productos asignados aún a esta colección.</p>
                            <button
                              type="button"
                              className={styles.btnSecondary}
                              onClick={(e) => handleEdit(collection, e)}
                            >
                              + Agregar productos
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

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