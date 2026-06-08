/**
 * features/admin/collections/AdminCollections.tsx
 * Página principal de gestión de colecciones.
 */

import React, { useState, useEffect } from 'react';
import type { Collection } from './collectionsService';
import { collectionsService } from './collectionsService';
import AdminCollectionForm from './AdminCollectionForm';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import styles from './AdminCollections.module.css';
import { Badge } from '../../../components/ui/Badge/Badge';
import { AdminPagination } from '../../../components/ui/AdminPagination/AdminPagination';
import { Search } from 'lucide-react';

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
      // Bulk delete: eliminar todas en paralelo
      await Promise.all(idsToDelete.map((id) => collectionsService.delete(id)));
      // Feedback visual (reemplaza por tu sistema de toasts preferido)
      // toast.success(idsToDelete.length > 1 ? 'Colecciones eliminadas' : 'Colección eliminada');
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

      <div className={styles.filters}>
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
        <select
          value={displayPosition}
          onChange={(e) => {
            setDisplayPosition(e.target.value);
            setPage(1);
          }}
          className={styles.selectFilter}
        >
          <option value="">Todas las posiciones</option>
          <option value="home">Home</option>
          <option value="category">Categoría</option>
        </select>
        <select
          value={filterActive === undefined ? '' : filterActive ? 'true' : 'false'}
          onChange={(e) => {
            setFilterActive(
              e.target.value === '' ? undefined : e.target.value === 'true'
            );
            setPage(1);
          }}
          className={styles.selectFilter}
        >
          <option value="">Todas</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>
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
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todas"
                    checked={collections.length > 0 && selectedIds.length === collections.length}
                    ref={el => {
                      if (el) el.indeterminate = selectedIds.length > 0 && selectedIds.length < collections.length;
                    }}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(collections.map((c) => c.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
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
                return (
                  <tr key={collection.id}>
                    <td>
                      <strong>{collection.name}</strong>
                    </td>
                    <td className={styles.monospace}>{collection.slug}</td>
                    <td>
                      <span className={collection.type === 'auto_sales' ? styles.badgeAuto : styles.badgeManual}>
                        {collection.type === 'auto_sales' ? 'Auto ventas' : 'Manual'}
                      </span>
                    </td>
                    <td><strong>{collection.displayPosition === 'home' ? 'Home' : 'Categoría'}</strong></td>
                    <td>
                      <Badge>
                        {collection.displayOrder}
                      </Badge>

                    </td>
                    <td>{collection.productCount}</td>
                    <td>
                      <span
                        className={
                          collection.isActive ? styles.badgeActive : styles.badgeInactive
                        }
                      >
                        {collection.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
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
