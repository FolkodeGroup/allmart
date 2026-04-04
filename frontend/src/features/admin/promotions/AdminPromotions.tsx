/**
 * features/admin/promotions/AdminPromotions.tsx
 * Página principal de gestión de promociones.
 */

import React, { useState, useEffect } from 'react';
import type { Promotion } from './promotionsService';
import { promotionsService } from './promotionsService';
import AdminPromotionForm from './AdminPromotionForm';
import styles from './AdminPromotions.module.css';

type ViewMode = 'list' | 'form';

const AdminPromotions: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>();
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limit = 10;

  useEffect(() => {
    loadPromotions();
  }, [page, search, filterActive]);

  async function loadPromotions() {
    setLoading(true);
    setError(null);
    try {
      const result = await promotionsService.getAll(page, limit, search, filterActive);
      setPromotions(result.data);
      setPages(result.pagination.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando promociones');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Está seguro de que desea eliminar esta promoción?')) return;
    try {
      await promotionsService.delete(id);
      await loadPromotions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando promoción');
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await promotionsService.duplicate(id);
      await loadPromotions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error duplicando promoción');
    }
  }

  function handleEdit(promo: Promotion) {
    setSelectedPromotion(promo);
    setViewMode('form');
  }

  function handleNew() {
    setSelectedPromotion(null);
    setViewMode('form');
  }

  function handleFormSubmit() {
    setViewMode('list');
    loadPromotions();
  }

  function handleFormCancel() {
    setViewMode('list');
  }

  if (viewMode === 'form') {
    return (
      <AdminPromotionForm
        promotion={selectedPromotion}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestionar Promociones</h1>
        <button className={styles.btnPrimary} onClick={handleNew}>
          + Nueva Promoción
        </button>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar promociones..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className={styles.searchInput}
        />
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
              <th>Tipo</th>
              <th>Valor</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.loading}>
                  Cargando...
                </td>
              </tr>
            ) : promotions.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  No hay promociones
                </td>
              </tr>
            ) : (
              promotions.map((promo) => (
                <tr key={promo.id}>
                  <td>
                    <strong>{promo.name}</strong>
                  </td>
                  <td>{promo.type === 'percentage' ? '%' : promo.type === 'fixed' ? '$' : 'BOGO'}</td>
                  <td>{promo.value}</td>
                  <td>{new Date(promo.startDate).toLocaleDateString()}</td>
                  <td>{new Date(promo.endDate).toLocaleDateString()}</td>
                  <td>
                    <span
                      className={promo.isActive ? styles.badgeActive : styles.badgeInactive}
                    >
                      {promo.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    <button onClick={() => handleEdit(promo)} className={styles.btnSmall}>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDuplicate(promo.id)}
                      className={styles.btnSmallSecondary}
                    >
                      Duplicar
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
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

export default AdminPromotions;
