/**
 * features/admin/collections/AdminCollections.tsx
 * Página principal de gestión de colecciones.
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { Collection } from './collectionsService';
import { collectionsService } from './collectionsService';
import AdminCollectionForm from './AdminCollectionForm';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import styles from './AdminCollections.module.css';
import { Badge } from '../../../components/ui/Badge/Badge';
import { AdminPagination } from '../../../components/ui/AdminPagination/AdminPagination';
import { Search } from 'lucide-react';
import { Dropdown } from '../../../components/ui/Dropdown/Dropdown';

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
  // Bulk delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [idsToDelete, setIdsToDelete] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ── Mobile: acordeón + menú de 3 puntos ───────────────────────────────
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  function toggleExpand(id: string) {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleMenu(id: string) {
    setOpenMenuId((prev) => (prev === id ? null : id));
  }

  // Cierra el menú de 3 puntos al hacer click afuera
  useEffect(() => {
    if (!openMenuId) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(`[data-kebab="${openMenuId}"]`)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const limit = 10;

  useEffect(() => {
    loadCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filterActive, displayPosition]);

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

  // ─── Opciones para Dropdowns Unificados ─────────────────────────────────────
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
        <h1>Gestionar Colecciones</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

        {/* Dropdown Unificado: Posiciones */}
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

        {/* Dropdown Unificado: Activo/Inactivo */}
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
        <table className={styles.table}>
          <thead>
            <tr>
              <th>NOMBRE</th>
              <th>SLUG</th>
              <th>TIPO</th>
              <th>POSICIÓN</th>
              <th>ORDEN</th>
              <th>PRODUCTOS</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
              <th className={styles.selectColHeader}>
                <div className={styles.selectColHeaderContent}>
                  <span className={styles.selectColLabel}>SELECCIÓN</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className={styles.loading}>
                  Cargando...
                </td>
              </tr>
            ) : collections.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.empty}>
                  No hay colecciones
                </td>
              </tr>
            ) : (
              collections.map((collection) => {
                const checked = selectedIds.includes(collection.id);
                const isExpanded = expandedIds.includes(collection.id);
                const isMenuOpen = openMenuId === collection.id;
                return (
                  <tr key={collection.id} className={isExpanded ? styles.rowExpanded : undefined}>
                    <td
                      className={styles.tdCollectionName}
                      onClick={() => toggleExpand(collection.id)}
                    >
                      <strong>{collection.name}</strong>
                      <button
                        type="button"
                        className={styles.expandToggle}
                        onClick={(e) => { e.stopPropagation(); toggleExpand(collection.id); }}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                      >
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    </td>
                    <td data-label="Slug" className={`${styles.monospace} ${styles.detailCell}`}>{collection.slug}</td>
                    <td data-label="Tipo" className={styles.detailCell}>
                      <span className={collection.type === 'auto_sales' ? styles.badgeAuto : styles.badgeManual}>
                        {collection.type === 'auto_sales' ? 'Auto ventas' : 'Manual'}
                      </span>
                    </td>
                    <td data-label="Posición" className={styles.detailCell}><strong>{collection.displayPosition === 'home' ? 'Home' : 'Categoría'}</strong></td>
                    <td data-label="Orden" className={styles.detailCell}>
                      <Badge>
                        {collection.displayOrder}
                      </Badge>
                    </td>
                    <td data-label="Productos" className={styles.detailCell}>{collection.productCount}</td>
                    <td data-label="Estado" className={styles.detailCell}>
                      <span
                        className={
                          collection.isActive ? styles.badgeActive : styles.badgeInactive
                        }
                      >
                        {collection.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      {/* Desktop: botones visibles siempre */}
                      <div className={`${styles.actions} ${styles.desktopActions}`}>
                        <button onClick={() => handleEdit(collection)} className={styles.btnSmall}>
                          EDITAR
                        </button>
                        <button
                          onClick={() => handleDelete(collection.id)}
                          className={styles.btnSmallDanger}
                          disabled={deleting}
                        >
                          ELIMINAR
                        </button>
                      </div>
                      {/* Mobile: menú de 3 puntos */}
                      <div className={styles.mobileActionsMenu} data-kebab={collection.id}>
                        <button
                          type="button"
                          className={styles.kebabBtn}
                          onClick={(e) => { e.stopPropagation(); toggleMenu(collection.id); }}
                          aria-label="Más acciones"
                          aria-expanded={isMenuOpen}
                        >
                          ⋮
                        </button>
                        {isMenuOpen && (
                          <div className={styles.kebabMenu} role="menu">
                            <button
                              type="button"
                              role="menuitem"
                              className={styles.kebabMenuItem}
                              onClick={() => { setOpenMenuId(null); handleEdit(collection); }}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className={`${styles.kebabMenuItem} ${styles.kebabMenuItemDanger}`}
                              onClick={() => { setOpenMenuId(null); handleDelete(collection.id); }}
                              disabled={deleting}
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={styles.selectColCell}>
                      <div className={styles.selectColCellContent}>
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
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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