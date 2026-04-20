/**
 * features/admin/promotions/AdminPromotionMatrix.tsx
 * Vista de matriz: muestra todas las promociones con sus productos/categorías asignados.
 * Permite bulk-assign/unassign desde aquí.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { PromotionMatrixItem, PromotionProductsResult } from './promotionsService';
import { promotionsService } from './promotionsService';
import styles from './AdminPromotions.module.css';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: 'Activa', className: 'badgeActive' },
  inactive: { label: 'Inactiva', className: 'badgeInactive' },
  expired: { label: 'Vencida', className: 'badgeExpired' },
  upcoming: { label: 'Próxima', className: 'badgeUpcoming' },
};

function getPromotionStatus(item: PromotionMatrixItem): keyof typeof STATUS_CONFIG {
  if (!item.isActive) return 'inactive';
  const now = new Date();
  if (new Date(item.endDate) < now) return 'expired';
  if (new Date(item.startDate) > now) return 'upcoming';
  return 'active';
}

function formatTypeLabel(type: string, value: number): string {
  if (type === 'percentage') return `${value}% desc.`;
  if (type === 'fixed') return `$${value} desc.`;
  if (type === 'bogo') return 'BOGO';
  return String(value);
}

const AdminPromotionMatrix: React.FC = () => {
  const [matrix, setMatrix] = useState<PromotionMatrixItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expanded row detail
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PromotionProductsResult | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filter
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired' | 'upcoming'>('all');
  const [search, setSearch] = useState('');

  const loadMatrix = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await promotionsService.getMatrix();
      setMatrix(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando matriz');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMatrix(); }, [loadMatrix]);

  async function handleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setLoadingDetail(true);
    setDetail(null);
    try {
      const result = await promotionsService.getProducts(id);
      setDetail(result);
    } catch {
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleRemoveProduct(promotionId: string, productId: string) {
    try {
      await promotionsService.assign(promotionId, { mode: 'remove', productIds: [productId] });
      // Refresh detail and matrix counts
      const [newDetail, newMatrix] = await Promise.all([
        promotionsService.getProducts(promotionId),
        promotionsService.getMatrix(),
      ]);
      setDetail(newDetail);
      setMatrix(newMatrix);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al remover producto');
    }
  }

  async function handleRemoveCategory(promotionId: string, categoryId: string) {
    try {
      await promotionsService.assign(promotionId, { mode: 'remove', categoryIds: [categoryId] });
      const [newDetail, newMatrix] = await Promise.all([
        promotionsService.getProducts(promotionId),
        promotionsService.getMatrix(),
      ]);
      setDetail(newDetail);
      setMatrix(newMatrix);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al remover categoría');
    }
  }

  // Filtered list
  const filtered = matrix.filter((item) => {
    const statusMatch = filterStatus === 'all' || getPromotionStatus(item) === filterStatus;
    const searchMatch = item.name.toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  // Summary counts
  const activeCount = matrix.filter((i) => getPromotionStatus(i) === 'active').length;
  const upcomingCount = matrix.filter((i) => getPromotionStatus(i) === 'upcoming').length;
  const expiredCount = matrix.filter((i) => getPromotionStatus(i) === 'expired').length;

  return (
    <div className={styles.matrixContainer}>
      {/* ─── Stats row ───────────────────────────────────────────────── */}
      <div className={styles.matrixStats}>
        <button type="button" className={styles.statCard} onClick={() => setFilterStatus('all')}>
          <span className={styles.statNumber}>{matrix.length}</span>
          <span className={styles.statLabel}>Total</span>
        </button>
        <button type="button" className={`${styles.statCard} ${styles.statCardGreen}`} onClick={() => setFilterStatus('active')}>
          <span className={styles.statNumber}>{activeCount}</span>
          <span className={styles.statLabel}>Activas</span>
        </button>
        <button type="button" className={`${styles.statCard} ${styles.statCardBlue}`} onClick={() => setFilterStatus('upcoming')}>
          <span className={styles.statNumber}>{upcomingCount}</span>
          <span className={styles.statLabel}>Próximas</span>
        </button>
        <button type="button" className={`${styles.statCard} ${styles.statCardGray}`} onClick={() => setFilterStatus('expired')}>
          <span className={styles.statNumber}>{expiredCount}</span>
          <span className={styles.statLabel}>Vencidas</span>
        </button>
      </div>

      {/* ─── Filters ─────────────────────────────────────────────────── */}
      <div className={styles.filters}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar promoción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.selectFilter}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="upcoming">Próximas</option>
          <option value="inactive">Inactivas</option>
          <option value="expired">Vencidas</option>
        </select>
        <button className={styles.btnSmall} onClick={loadMatrix} disabled={loading}>
          ↻ Actualizar
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* ─── Matrix table ─────────────────────────────────────────────── */}
      {loading ? (
        <p className={styles.loading}>Cargando matriz...</p>
      ) : (
        <div className={styles.matrixTableWrapper}>
          {filtered.length === 0 ? (
            <p className={styles.empty}>No hay promociones que coincidan</p>
          ) : (
            filtered.map((item) => {
              const status = getPromotionStatus(item);
              const statusCfg = STATUS_CONFIG[status];
              const isExpanded = expandedId === item.id;

              return (
                <div key={item.id} className={`${styles.matrixRow} ${isExpanded ? styles.matrixRowExpanded : ''}`}>
                  {/* ─── Row header ──────────────────────────────────── */}
                  <button type="button" className={styles.matrixRowHeader} onClick={() => handleExpand(item.id)}>
                    <div className={styles.matrixRowInfo}>
                      <span className={styles.matrixRowName}>{item.name}</span>
                      <span className={styles.matrixRowDiscount}>{formatTypeLabel(item.type, item.value)}</span>
                      <span className={styles[statusCfg.className]}>{statusCfg.label}</span>
                    </div>
                    <div className={styles.matrixRowCounts}>
                      <span className={styles.matrixCount} title="Productos directos">
                        📦 {item.directProductCount}
                      </span>
                      <span className={styles.matrixCount} title="Categorías">
                        🏷️ {item.categoryCount}
                      </span>
                      <span className={styles.matrixCountTotal} title="Total afectados">
                        ≈ {item.totalAffectedProducts} productos
                      </span>
                      <span className={styles.matrixDates}>
                        {new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}
                      </span>
                      <span className={styles.matrixChevron}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {/* ─── Expanded detail ─────────────────────────────── */}
                  {isExpanded && (
                    <div className={styles.matrixDetail}>
                      {loadingDetail ? (
                        <p className={styles.loading}>Cargando detalle...</p>
                      ) : !detail ? (
                        <p className={styles.empty}>No se pudo cargar el detalle</p>
                      ) : (
                        <div className={styles.matrixDetailGrid}>
                          {/* Categorías asignadas */}
                          {detail.categories.length > 0 && (
                            <div className={styles.matrixDetailSection}>
                              <h4 className={styles.matrixDetailTitle}>
                                🏷️ Categorías asignadas ({detail.categories.length})
                              </h4>
                              <div className={styles.matrixTagList}>
                                {detail.categories.map((cat) => (
                                  <span key={cat.id} className={styles.matrixTag}>
                                    {cat.name}
                                    <button
                                      className={styles.matrixTagRemove}
                                      title="Quitar categoría"
                                      onClick={(e) => { e.stopPropagation(); handleRemoveCategory(item.id, cat.id); }}
                                    >✕</button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Productos via categorías */}
                          {detail.categoryProducts.length > 0 && (
                            <div className={styles.matrixDetailSection}>
                              <h4 className={styles.matrixDetailTitle}>
                                📂 Incluidos vía categoría ({detail.categoryProducts.length})
                              </h4>
                              <div className={styles.matrixProductList}>
                                {detail.categoryProducts.slice(0, 10).map((p) => (
                                  <div key={p.id} className={styles.matrixProductRow}>
                                    <span className={styles.matrixProductName}>{p.name}</span>
                                    <span className={styles.matrixProductCategory}>{p.assignedViaCategory}</span>
                                    <span className={styles.matrixProductPrice}>${p.price.toFixed(2)}</span>
                                  </div>
                                ))}
                                {detail.categoryProducts.length > 10 && (
                                  <p className={styles.matrixMoreText}>…y {detail.categoryProducts.length - 10} más</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Productos directos */}
                          <div className={styles.matrixDetailSection}>
                            <h4 className={styles.matrixDetailTitle}>
                              📦 Productos directos ({detail.directProducts.length})
                            </h4>
                            {detail.directProducts.length === 0 ? (
                              <p className={styles.matrixEmptySection}>Ninguno</p>
                            ) : (
                              <div className={styles.matrixProductList}>
                                {detail.directProducts.map((p) => (
                                  <div key={p.id} className={styles.matrixProductRow}>
                                    <span className={styles.matrixProductName}>{p.name}</span>
                                    <span className={styles.matrixProductPrice}>${p.price.toFixed(2)}</span>
                                    <button
                                      className={styles.btnSmallDanger}
                                      title="Quitar de esta promoción"
                                      onClick={(e) => { e.stopPropagation(); handleRemoveProduct(item.id, p.id); }}
                                    >✕</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {detail.directProducts.length === 0 && detail.categories.length === 0 && (
                            <p className={styles.matrixEmptySection}>
                              Esta promoción no tiene productos ni categorías asignados todavía.
                              Editala para agregarlos.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPromotionMatrix;
