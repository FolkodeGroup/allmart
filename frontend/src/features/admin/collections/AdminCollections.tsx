/**
 * features/admin/collections/AdminCollections.tsx
 * Página principal de gestión de colecciones.
 */

import React, { useState, useEffect } from 'react';
import type { Collection } from './collectionsService';
import { collectionsService } from './collectionsService';
import AdminCollectionForm from './AdminCollectionForm';
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

  const limit = 10;

  useEffect(() => {
    loadCollections();
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

  async function handleDelete(id: string) {
    if (!confirm('¿Está seguro de que desea eliminar esta colección?')) return;
    try {
      await collectionsService.delete(id);
      await loadCollections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando colección');
    }
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
        <button className={styles.btnPrimary} onClick={handleNew}>
          + Nueva Colección
        </button>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar colecciones..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className={styles.searchInput}
        />
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
              <th>Nombre</th>
              <th>Slug</th>
              <th>Posición</th>
              <th>Productos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles.loading}>
                  Cargando...
                </td>
              </tr>
            ) : collections.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  No hay colecciones
                </td>
              </tr>
            ) : (
              collections.map((collection) => (
                <tr key={collection.id}>
                  <td>
                    <strong>{collection.name}</strong>
                  </td>
                  <td className={styles.monospace}>{collection.slug}</td>
                  <td>{collection.displayPosition === 'home' ? 'Home' : 'Categoría'}</td>
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
                  <td className={styles.actions}>
                    <button onClick={() => handleEdit(collection)} className={styles.btnSmall}>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(collection.id)}
                      className={styles.btnSmallDanger}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className={styles.btnSmall}
        >
          Anterior
        </button>
        <span>
          Página {page} de {pages}
        </span>
        <button
          disabled={page === pages}
          onClick={() => setPage(page + 1)}
          className={styles.btnSmall}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default AdminCollections;
