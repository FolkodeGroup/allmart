/**
 * features/admin/promotions/AdminPromotions.tsx
 * Página principal de gestión de promociones — layout de 2 pestañas:
 *   Pestaña 1: Campañas (CRUD de promociones)
 *   Pestaña 2: Matriz de Productos (vista de qué productos cubre cada promo)
 */

import { useState, useEffect, useMemo } from 'react';
import type { Promotion } from './promotionsService';
import { promotionsService } from './promotionsService';
import AdminPromotionForm from './AdminPromotionForm';
import AdminPromotionMatrix from './AdminPromotionMatrix';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import styles from './AdminPromotions.module.css';
import { Badge } from '../../../components/ui/Badge/Badge';
import { Search, Edit2, Trash2, Calendar, Tag } from 'lucide-react';
import { AdminPagination } from '../../../components/ui/AdminPagination/AdminPagination';
import { Dropdown } from '../../../components/ui/Dropdown/Dropdown';

type ViewMode = 'list' | 'form';
type MainTab = 'campaigns' | 'matrix';

function getPromotionStatusInfo(promo: Promotion): { label: string; className: string } {
  if (!promo.isActive) return { label: 'Inactiva', className: styles.badgeInactive };
  const now = new Date();
  if (new Date(promo.endDate) < now) return { label: 'Vencida', className: styles.badgeExpired };
  if (new Date(promo.startDate) > now) return { label: 'Próxima', className: styles.badgeUpcoming };
  return { label: 'Activa', className: styles.badgeActive };
}

function formatValueDisplay(type: string, value: number): string {
  if (type === 'percentage') return `${value}% OFF`;
  if (type === 'fixed') return `$${value.toLocaleString('es-AR')} OFF`;
  if (type === 'bogo') return 'Lleva 1 Gratis (BOGO)';
  return `$${value}`;
}

export function AdminPromotions() {
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

  async function handleEdit(promo: Promotion) {
    try {
      const fullPromotion = await promotionsService.getById(promo.id);
      setSelectedPromotion(fullPromotion);
    } catch {
      setSelectedPromotion(promo);
    }
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

  const filterActiveOptions = useMemo(() => [
    { value: '', label: 'Todas las promociones' },
    { value: 'true', label: 'Activas' },
    { value: 'false', label: 'Inactivas' }
  ], []);

  const activeFilterValue = useMemo(() => {
    return filterActive === undefined ? '' : filterActive ? 'true' : 'false';
  }, [filterActive]);

  const handleFilterActiveChange = (val: string) => {
    setFilterActive(
      val === '' ? undefined : val === 'true'
    );
    setPage(1);
  };

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
      {/* Header Unificado: Pestañas + Botón 'Nueva Promoción' al mismo nivel en Escritorio */}
      <div className={styles.topHeaderBar}>
        <div className={styles.mainTabs}>
          <button
            type="button"
            className={mainTab === 'campaigns' ? styles.mainTabActive : styles.mainTab}
            onClick={() => setMainTab('campaigns')}
          >
            Campañas
          </button>
          <button
            type="button"
            className={mainTab === 'matrix' ? styles.mainTabActive : styles.mainTab}
            onClick={() => setMainTab('matrix')}
          >
            Matriz de Productos
          </button>
        </div>

        <button type="button" className={styles.btnPrimary} onClick={handleNew}>
          <span>Nueva Promoción</span>
        </button>
      </div>

      {mainTab === 'campaigns' && (
        <>
          <div className={styles.filters}>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar promociones por nombre..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                autoComplete="off"
                spellCheck="false"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>
            <div className={styles.filterDropdownWrap}>
              <Dropdown
                options={filterActiveOptions}
                value={activeFilterValue}
                onChange={handleFilterActiveChange}
                placeholder="Todas"
              />
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {/* 💻 VISTA ESCRITORIO (>= 768px): Tabla tradicional estilizada */}
          <div className={styles.tableWrapperDesktop}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>NOMBRE</th>
                  <th>TIPO</th>
                  <th>VALOR</th>
                  <th>INICIO</th>
                  <th>FIN</th>
                  <th>ESTADO</th>
                  <th className={styles.thActions}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className={styles.loading}>
                      Cargando promociones...
                    </td>
                  </tr>
                ) : promotions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.empty}>
                      No hay promociones registradas
                    </td>
                  </tr>
                ) : (
                  promotions.map((promo) => {
                    const statusInfo = getPromotionStatusInfo(promo);
                    return (
                      <tr key={promo.id}>
                        <td>
                          <strong className={styles.promoNameText}>{promo.name}</strong>
                          {promo.description && (
                            <div className={styles.tableSubtext}>{promo.description}</div>
                          )}
                        </td>
                        <td>
                          <Badge
                            variant={
                              promo.type === 'percentage'
                                ? 'discount'
                                : promo.type === 'fixed'
                                  ? 'new'
                                  : 'limited'
                            }
                          >
                            {promo.type === 'percentage'
                              ? '%'
                              : promo.type === 'fixed'
                                ? '$'
                                : 'BOGO'}
                          </Badge>
                        </td>
                        <td className={styles.tdValue}>
                          {formatValueDisplay(promo.type, promo.value)}
                        </td>
                        <td className={styles.tdDate}>
                          {new Date(promo.startDate).toLocaleDateString('es-AR')}
                        </td>
                        <td className={styles.tdDate}>
                          {new Date(promo.endDate).toLocaleDateString('es-AR')}
                        </td>
                        <td>
                          <span className={statusInfo.className}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className={styles.actions}>
                          <button
                            type="button"
                            onClick={() => handleEdit(promo)}
                            className={styles.btnSmall}
                            title="Editar promoción"
                          >
                            EDITAR
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(promo.id, promo.name)}
                            className={styles.btnSmallDanger}
                            title="Eliminar promoción"
                          >
                            ELIMINAR
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 📱 VISTA MÓVIL (< 768px): Tarjetas táctiles sin scroll horizontal */}
          <div className={styles.mobileCardsList}>
            {loading ? (
              <div className={styles.loading}>Cargando promociones...</div>
            ) : promotions.length === 0 ? (
              <div className={styles.empty}>No hay promociones registradas</div>
            ) : (
              promotions.map((promo) => {
                const statusInfo = getPromotionStatusInfo(promo);
                return (
                  <div key={promo.id} className={styles.mobileCard}>
                    {/* Header de la tarjeta */}
                    <div className={styles.mobileCardHeader}>
                      <div className={styles.mobileCardTitleGroup}>
                        <h3 className={styles.mobileCardTitle}>{promo.name}</h3>
                        <Badge
                          variant={
                            promo.type === 'percentage'
                              ? 'discount'
                              : promo.type === 'fixed'
                                ? 'new'
                                : 'limited'
                          }
                        >
                          {promo.type === 'percentage' ? '%' : promo.type === 'fixed' ? '$' : 'BOGO'}
                        </Badge>
                      </div>
                      <span className={statusInfo.className}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Descripción si existe */}
                    {promo.description && (
                      <p className={styles.mobileCardDescription}>{promo.description}</p>
                    )}

                    {/* Detalles de la tarjeta */}
                    <div className={styles.mobileCardBody}>
                      <div className={styles.mobileCardValueRow}>
                        <span className={styles.mobileCardValueLabel}>Descuento:</span>
                        <strong className={styles.mobileCardValueHighlight}>
                          {formatValueDisplay(promo.type, promo.value)}
                        </strong>
                      </div>

                      <div className={styles.mobileCardMetaRow}>
                        <div className={styles.mobileCardMetaItem}>
                          <Calendar size={14} className={styles.mobileCardMetaIcon} />
                          <span>
                            {new Date(promo.startDate).toLocaleDateString('es-AR')} al {new Date(promo.endDate).toLocaleDateString('es-AR')}
                          </span>
                        </div>

                        {promo.rules && (promo.rules.productIds?.length > 0 || promo.rules.categoryIds?.length > 0) && (
                          <div className={styles.mobileCardMetaItem}>
                            <Tag size={14} className={styles.mobileCardMetaIcon} />
                            <span>
                              {promo.rules.productIds?.length ?? 0} prods / {promo.rules.categoryIds?.length ?? 0} cats
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones Táctiles de 44px+ */}
                    <div className={styles.mobileCardActions}>
                      <button
                        type="button"
                        className={styles.mobileCardBtnEdit}
                        onClick={() => handleEdit(promo)}
                      >
                        <Edit2 size={15} />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        className={styles.mobileCardBtnDelete}
                        onClick={() => handleDeleteClick(promo.id, promo.name)}
                      >
                        <Trash2 size={15} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <AdminPagination
            page={page}
            totalPages={pages}
            onPageChange={setPage}
            ariaLabel="Paginación de promociones"
          />
        </>
      )}

      {mainTab === 'matrix' && <AdminPromotionMatrix />}

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
}

export default AdminPromotions;