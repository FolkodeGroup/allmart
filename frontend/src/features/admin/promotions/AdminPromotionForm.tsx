/**
 * features/admin/promotions/AdminPromotionForm.tsx
 * Formulario completo para crear/editar promociones con selector
 * de productos y categorías integrado.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { Promotion } from './promotionsService';
import { promotionsService } from './promotionsService';
import { fetchAdminCategories } from '../categories/categoriesService';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { apiFetch } from '../../../utils/apiClient';
import styles from './AdminPromotions.module.css';

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  status: string;
  categoryId: string | null;
}

interface Props {
  promotion?: Promotion | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const TYPE_LABELS = {
  percentage: 'Porcentaje (%)',
  fixed: 'Monto Fijo ($)',
  bogo: 'BOGO (Lleva 1 Gratis)',
};

const AdminPromotionForm: React.FC<Props> = ({ promotion, onSubmit, onCancel }) => {
  const { token } = useAdminAuth();

  // ─── Form fields ─────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed' | 'bogo'>('percentage');
  const [value, setValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [priority, setPriority] = useState('0');
  const [isActive, setIsActive] = useState(true);

  // ─── Rules ───────────────────────────────────────────────────────────────
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // ─── Selectors data ──────────────────────────────────────────────────────
  const [allProducts, setAllProducts] = useState<AdminProduct[]>([]);
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [loadingSelectors, setLoadingSelectors] = useState(false);

  // ─── UI ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'details' | 'products' | 'categories'>('details');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ─── Init from existing promotion ────────────────────────────────────────
  useEffect(() => {
    if (promotion) {
      setName(promotion.name);
      setDescription(promotion.description ?? '');
      setType(promotion.type);
      setValue(String(promotion.value));
      setStartDate(promotion.startDate.split('T')[0]);
      setEndDate(promotion.endDate.split('T')[0]);
      setMinPurchase(promotion.minPurchaseAmount?.toString() ?? '');
      setMaxDiscount(promotion.maxDiscount?.toString() ?? '');
      setPriority(String(promotion.priority));
      setIsActive(promotion.isActive);
      setSelectedProductIds(promotion.rules?.productIds ?? []);
      setSelectedCategoryIds(promotion.rules?.categoryIds ?? []);
    }
  }, [promotion]);

  // ─── Load selectors ──────────────────────────────────────────────────────
  const loadSelectors = useCallback(async () => {
    setLoadingSelectors(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        apiFetch<{ data: { data: Array<{ id: string; name: string; slug: string; price: number; status: string; categoryId: string | null }> } }>('/api/admin/products?limit=500', {}, token ?? undefined),
        fetchAdminCategories(token ?? '', { limit: 200 }),
      ]);
      const rawProducts = productsRes?.data?.data ?? [];
      setAllProducts(
        rawProducts.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.price),
          status: p.status,
          categoryId: p.categoryId ?? null,
        }))
      );
      setAllCategories(categoriesRes.data.map((c) => ({ id: c.id, name: c.name })));
    } catch (err) {
      console.error('Error loading selectors:', err);
      // Silencioso: los selectores son opcionales
    } finally {
      setLoadingSelectors(false);
    }
  }, [token]);

  useEffect(() => {
    loadSelectors();
  }, [loadSelectors]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  function toggleProduct(id: string) {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('El nombre es requerido'); return; }
    if (!value || isNaN(Number(value)) || Number(value) < 0) { setError('El valor debe ser un número positivo'); return; }
    if (!startDate || !endDate) { setError('Las fechas son requeridas'); return; }
    if (new Date(startDate) >= new Date(endDate)) { setError('La fecha de fin debe ser posterior a la de inicio'); return; }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        value: Number(value),
        startDate,
        endDate,
        minPurchaseAmount: minPurchase ? Number(minPurchase) : undefined,
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        priority: Number(priority),
        isActive,
        rules: { productIds: selectedProductIds, categoryIds: selectedCategoryIds },
      };

      if (promotion) {
        await promotionsService.update(promotion.id, payload);
      } else {
        await promotionsService.create(payload);
      }
      onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando promoción');
    } finally {
      setSaving(false);
    }
  }

  // ─── Filtered lists ──────────────────────────────────────────────────────
  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );
  const filteredCategories = allCategories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const affectedByCategoryCount = allProducts.filter(
    (p) => p.categoryId && selectedCategoryIds.includes(p.categoryId)
  ).length;

  return (
    <div className={styles.container}>
      <div className={styles.formHeader}>
        <h1>{promotion ? 'Editar Promoción' : 'Nueva Promoción'}</h1>
        <span className={styles.formSubtitle}>
          {selectedProductIds.length} productos · {selectedCategoryIds.length} categorías
          {affectedByCategoryCount > 0 && ` · ~${affectedByCategoryCount} via categoría`}
        </span>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* ─── Tabs ─────────────────────────────────────────────────────── */}
      <div className={styles.formTabs}>
        <button type="button" className={activeTab === 'details' ? styles.formTabActive : styles.formTab} onClick={() => setActiveTab('details')}>
          📋 Detalles
        </button>
        <button type="button" className={activeTab === 'products' ? styles.formTabActive : styles.formTab} onClick={() => setActiveTab('products')}>
          📦 Productos {selectedProductIds.length > 0 && <span className={styles.tabBadge}>{selectedProductIds.length}</span>}
        </button>
        <button type="button" className={activeTab === 'categories' ? styles.formTabActive : styles.formTab} onClick={() => setActiveTab('categories')}>
          🏷️ Categorías {selectedCategoryIds.length > 0 && <span className={styles.tabBadge}>{selectedCategoryIds.length}</span>}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ─── TAB: DETALLES ──────────────────────────────────────────── */}
        {activeTab === 'details' && (
          <div className={styles.formBody}>
            <div className={styles.formGroup}>
              <label htmlFor="promo-name">Nombre *</label>
              <input id="promo-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Black Friday 50%, Cyber Week..." />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="promo-desc">Descripción</label>
              <textarea id="promo-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles para el administrador" rows={2} />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="promo-type">Tipo de Descuento *</label>
                <select id="promo-type" value={type} onChange={(e) => setType(e.target.value as Promotion['type'])}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="promo-value">Valor *</label>
                <input id="promo-value" type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === 'percentage' ? '0 – 100' : '0'} min="0" step={type === 'percentage' ? '0.01' : '1'} />
                <small>{type === 'percentage' ? 'Porcentaje de descuento' : type === 'fixed' ? 'Pesos de descuento' : 'Aplica al 2do artículo'}</small>
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="promo-start">Fecha de Inicio *</label>
                <input id="promo-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="promo-end">Fecha de Fin *</label>
                <input id="promo-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="promo-min">Compra Mínima ($)</label>
                <input id="promo-min" type="number" value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} placeholder="Sin mínimo" min="0" step="0.01" />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="promo-max">Descuento Máximo ($)</label>
                <input id="promo-max" type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="Sin tope" min="0" step="0.01" />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="promo-priority">Prioridad</label>
                <input id="promo-priority" type="number" value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="0" />
                <small>Mayor número = se aplica primero cuando hay conflictos</small>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  Promoción activa
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: PRODUCTOS ─────────────────────────────────────────── */}
        {activeTab === 'products' && (
          <div className={styles.formBody}>
            <p className={styles.selectorHint}>
              Seleccioná los productos específicos a los que aplica esta promoción.
              También podés aplicarla a categorías enteras en la pestaña <strong>Categorías</strong>.
            </p>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar producto..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            {loadingSelectors ? (
              <p className={styles.loading}>Cargando productos...</p>
            ) : allProducts.length === 0 ? (
              <p className={styles.empty}>No hay productos disponibles</p>
            ) : (
              <>
                <div className={styles.selectorActions}>
                  <button type="button" className={styles.btnLink} onClick={() => setSelectedProductIds(filteredProducts.map((p) => p.id))}>
                    ✓ Seleccionar todos
                  </button>
                  <button type="button" className={styles.btnLink} onClick={() => setSelectedProductIds([])}>
                    ✗ Deseleccionar todos
                  </button>
                  <span className={styles.selectorCount}>{selectedProductIds.length} seleccionados</span>
                </div>
                <div className={styles.selectorList}>
                  {filteredProducts.map((product) => {
                    const isSelected = selectedProductIds.includes(product.id);
                    return (
                      <label key={product.id} className={`${styles.selectorItem} ${isSelected ? styles.selectorItemSelected : ''}`}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleProduct(product.id)} />
                        <span className={styles.selectorItemName}>{product.name}</span>
                        <span className={styles.selectorItemMeta}>${product.price.toFixed(2)}</span>
                      </label>
                    );
                  })}
                  {filteredProducts.length === 0 && allProducts.length > 0 && (
                    <p className={styles.empty}>No hay resultados de búsqueda</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── TAB: CATEGORÍAS ────────────────────────────────────────── */}
        {activeTab === 'categories' && (
          <div className={styles.formBody}>
            <p className={styles.selectorHint}>
              Al seleccionar una categoría, <strong>todos sus productos actuales y futuros</strong> quedan
              incluidos en la promoción automáticamente.
            </p>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar categoría..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
            />
            {loadingSelectors ? (
              <p className={styles.loading}>Cargando categorías...</p>
            ) : allCategories.length === 0 ? (
              <p className={styles.empty}>No hay categorías disponibles</p>
            ) : (
              <>
                <div className={styles.selectorActions}>
                  <button type="button" className={styles.btnLink} onClick={() => setSelectedCategoryIds(filteredCategories.map((c) => c.id))}>
                    ✓ Seleccionar todas
                  </button>
                  <button type="button" className={styles.btnLink} onClick={() => setSelectedCategoryIds([])}>
                    ✗ Deseleccionar todas
                  </button>
                  <span className={styles.selectorCount}>{selectedCategoryIds.length} seleccionadas</span>
                </div>
                <div className={styles.selectorList}>
                  {filteredCategories.map((cat) => {
                    const isSelected = selectedCategoryIds.includes(cat.id);
                    const productCount = allProducts.filter((p) => p.categoryId === cat.id).length;
                    return (
                      <label key={cat.id} className={`${styles.selectorItem} ${isSelected ? styles.selectorItemSelected : ''}`}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleCategory(cat.id)} />
                        <span className={styles.selectorItemName}>{cat.name}</span>
                        <span className={styles.selectorItemMeta}>{productCount} productos</span>
                      </label>
                    );
                  })}
                  {filteredCategories.length === 0 && allCategories.length > 0 && (
                    <p className={styles.empty}>No hay resultados de búsqueda</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div className={styles.formActions}>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? 'Guardando...' : promotion ? 'Actualizar Promoción' : 'Crear Promoción'}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPromotionForm;
