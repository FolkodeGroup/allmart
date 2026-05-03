/**
 * features/admin/promotions/AdminPromotions.tsx
 * Página principal de gestión de promociones — layout de 2 pestañas:
 *   Pestaña 1: Campañas (CRUD de promociones)
 *   Pestaña 2: Matriz de Productos (vista de qué productos cubre cada promo)
 */

import React, { useState, useEffect } from 'react';
import type { Promotion } from './promotionsService';
import { promotionsService } from './promotionsService';
import AdminPromotionForm from './AdminPromotionForm';
import AdminPromotionMatrix from './AdminPromotionMatrix';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import styles from './AdminPromotions.module.css';

type ViewMode = 'list' | 'form';
type MainTab = 'campaigns' | 'matrix';

const AdminPromotions: React.FC = () => {
  const [mainTab, setMainTab] = useState<MainTab>('campaigns');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>();
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confirmation modals
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);
  const [duplicateConfirmLoading, setDuplicateConfirmLoading] = useState(false);
  const [actionPromotionId, setActionPromotionId] = useState<string | null>(null);
  const [actionPromotionName, setActionPromotionName] = useState<string>('');

  const limit = 10;

  useEffect(() => {
    loadPromotions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function handleDeleteClick(id: string, name: string) {
    setActionPromotionId(id);
    setActionPromotionName(name);
    setDeleteConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    if (!actionPromotionId) return;
    setDeleteConfirmLoading(true);
    try {
      await promotionsService.delete(actionPromotionId);
      await loadPromotions();
      setDeleteConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando promoción');
    } finally {
      setDeleteConfirmLoading(false);
      setActionPromotionId(null);
      setActionPromotionName('');
    }
  }

  function handleDuplicateClick(id: string, name: string) {
    setActionPromotionId(id);
    setActionPromotionName(name);
    setDuplicateConfirmOpen(true);
  }

  async function handleConfirmDuplicate() {
    if (!actionPromotionId) return;
    setDuplicateConfirmLoading(true);
    try {
      await promotionsService.duplicate(actionPromotionId);
      await loadPromotions();
      setDuplicateConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error duplicando promoción');
    } finally {
      setDuplicateConfirmLoading(false);
      setActionPromotionId(null);
      setActionPromotionName('');
    }
  }

  function handleCancelDelete() {
    setDeleteConfirmOpen(false);
    setActionPromotionId(null);
    setActionPromotionName('');
  }

  function handleCancelDuplicate() {
    setDuplicateConfirmOpen(false);
    setActionPromotionId(null);
    setActionPromotionName('');
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

      {/* ─── Main Tabs ─────────────────────────────────────────────── */}
      <div className={styles.mainTabs}>
        <button
          className={mainTab === 'campaigns' ? styles.mainTabActive : styles.mainTab}
          onClick={() => setMainTab('campaigns')}
        >
          📣 Campañas
        </button>
        <button
          className={mainTab === 'matrix' ? styles.mainTabActive : styles.mainTab}
          onClick={() => setMainTab('matrix')}
        >
          🗂️ Matriz de Productos
        </button>
      </div>

      {/* ─── Tab: Campaigns ────────────────────────────────────────── */}
      {mainTab === 'campaigns' && (
        <>
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
                        {promo.description && (
                          <div className={styles.tableSubtext}>{promo.description}</div>
                        )}
                      </td>
                      <td>{promo.type === 'percentage' ? '%' : promo.type === 'fixed' ? '$' : 'BOGO'}</td>
                      <td>{promo.value}</td>
                      <td>{new Date(promo.startDate).toLocaleDateString()}</td>
                      <td>{new Date(promo.endDate).toLocaleDateString()}</td>
                      <td>
                        <span className={promo.isActive ? styles.badgeActive : styles.badgeInactive}>
                          {promo.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className={styles.actions}>
                        <button onClick={() => handleEdit(promo)} className={styles.btnSmall}>
                          Editar
                        </button>
                        <button
                          onClick={() => handleDuplicateClick(promo.id, promo.name)}
                          className={styles.btnSmallSecondary}
                        >
                          Duplicar
                        </button>
                        <button
                          onClick={() => handleDeleteClick(promo.id, promo.name)}
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
        </>
      )}

      {/* ─── Tab: Matrix ───────────────────────────────────────────── */}
      {mainTab === 'matrix' && <AdminPromotionMatrix />}

      {/* ─── Delete Confirmation Modal ─────────────────────────────── */}
      <ConfirmModal
        open={deleteConfirmOpen}
        title="Eliminar Promoción"
        message={`¿Está seguro de que desea eliminar la promoción "${actionPromotionName}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleteConfirmLoading}
      />

      {/* ─── Duplicate Confirmation Modal ───────────────────────────── */}
      <ConfirmModal
        open={duplicateConfirmOpen}
        title="Duplicar Promoción"
        message={`¿Desea duplicar la promoción "${actionPromotionName}"? Se creará una copia con el mismo nombre y configuración.`}
        confirmLabel="Duplicar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDuplicate}
        onCancel={handleCancelDuplicate}
        loading={duplicateConfirmLoading}
      />
    </div>
  );
};

export default AdminPromotions;
