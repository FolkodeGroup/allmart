/**
 * features/admin/promotions/AdminPromotionForm.tsx
 * Formulario completo para crear/editar promociones con selector
 * de productos y categorías integrado.
 * Diseño en tarjetas, responsive y compatible con Dark Mode.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useBlocker } from 'react-router-dom';
import type { Promotion } from './promotionsService';
import { promotionsService } from './promotionsService';
import { useUnsavedChangesWarning } from '../../../hooks/useUnsavedChangesWarning';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { fetchAdminCategories } from '../categories/categoriesService';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { apiFetch } from '../../../utils/apiClient';
import styles from './AdminPromotions.module.css';
import { Search, ArrowLeft, Tag, Percent, Calendar, Settings } from 'lucide-react';
import { DatePicker } from '../../../components/ui/DatePicker/DatePicker';
import { Dropdown } from '../../../components/ui/Dropdown/Dropdown';

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
  bogo: 'BOGO (Lleva 2 Paga 1)',
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
  const [valueError, setValueError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ─── Initial state snapshot (for dirty detection) ────────────────────────
  const [initialState] = useState(() => ({
    name: promotion?.name ?? '',
    description: promotion?.description ?? '',
    type: (promotion?.type ?? 'percentage') as 'percentage' | 'fixed' | 'bogo',
    value: promotion ? String(promotion.value) : '',
    startDate: promotion ? promotion.startDate.split('T')[0] : '',
    endDate: promotion ? promotion.endDate.split('T')[0] : '',
    minPurchase: promotion?.minPurchaseAmount?.toString() ?? '',
    maxDiscount: promotion?.maxDiscount?.toString() ?? '',
    priority: promotion ? String(promotion.priority) : '0',
    isActive: promotion?.isActive ?? true,
    selectedProductIds: (promotion?.rules?.productIds ?? []) as string[],
    selectedCategoryIds: (promotion?.rules?.categoryIds ?? []) as string[],
  }));

  const isDirty = useMemo(() =>
    name !== initialState.name ||
    description !== initialState.description ||
    type !== initialState.type ||
    value !== initialState.value ||
    startDate !== initialState.startDate ||
    endDate !== initialState.endDate ||
    minPurchase !== initialState.minPurchase ||
    maxDiscount !== initialState.maxDiscount ||
    priority !== initialState.priority ||
    isActive !== initialState.isActive ||
    JSON.stringify(selectedProductIds) !== JSON.stringify(initialState.selectedProductIds) ||
    JSON.stringify(selectedCategoryIds) !== JSON.stringify(initialState.selectedCategoryIds),
    [name, description, type, value, startDate, endDate, minPurchase, maxDiscount, priority, isActive, selectedProductIds, selectedCategoryIds, initialState]);

  const {
    showWarning,
    confirmNavigation,
    cancelNavigation,
    interceptNavigation,
    setIsDirty: setHookIsDirty,
  } = useUnsavedChangesWarning({ active: isDirty });

  useEffect(() => {
    setHookIsDirty(isDirty);
  }, [isDirty, setHookIsDirty]);

  const blocker = useBlocker(isDirty);

  const handleCancel = useCallback(() => {
    interceptNavigation(() => onCancel());
  }, [interceptNavigation, onCancel]);

  const typeOptions = useMemo(() => [
    { value: 'percentage', label: TYPE_LABELS.percentage },
    { value: 'fixed', label: TYPE_LABELS.fixed },
    { value: 'bogo', label: TYPE_LABELS.bogo }
  ], []);

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
    } finally {
      setLoadingSelectors(false);
    }
  }, [token]);

  useEffect(() => {
    loadSelectors();
  }, [loadSelectors]);

  const validateValue = useCallback((valueToValidate: string, discountType: 'percentage' | 'fixed' | 'bogo'): string | null => {
    if (!valueToValidate) return null;
    const numValue = Number(valueToValidate);
    if (isNaN(numValue)) return 'El valor debe ser numérico';
    if (discountType === 'percentage' && (numValue < 0 || numValue > 100)) return 'Debe estar entre 0 y 100';
    if (discountType === 'fixed' && numValue < 0) return 'Debe ser positivo';
    return null;
  }, []);

  useEffect(() => {
    setValueError(validateValue(value, type));
  }, [value, type, validateValue]);

  useEffect(() => {
    if (type === 'bogo' && value !== '0') setValue('0');
  }, [type, value]);

  const handleTypeChange = useCallback((newType: Promotion['type']) => {
    setType(newType);
    if (newType === 'bogo') setValue('0');
  }, []);

  function toggleProduct(id: string) {
    setSelectedProductIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    // Validaciones de campos básicos
    if (!name.trim()) { 
      setError('El nombre de la campaña es requerido.'); 
      setActiveTab('details');
      return; 
    }
    if (validateValue(value, type)) { 
      setError(validateValue(value, type)); 
      setActiveTab('details');
      return; 
    }
    if (!startDate || !endDate) { 
      setError('Las fechas de inicio y fin son requeridas.'); 
      setActiveTab('details');
      return; 
    }
    if (new Date(startDate) >= new Date(endDate)) { 
      setError('La fecha de fin debe ser posterior a la de inicio.'); 
      setActiveTab('details');
      return; 
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        value: Number(value),
        startDate,
        endDate,
        minPurchaseAmount: minPurchase !== '' ? Number(minPurchase) : undefined,
        maxDiscount: maxDiscount === '' ? null : Number(maxDiscount),
        priority: Number(priority),
        isActive,
        rules: { productIds: selectedProductIds, categoryIds: selectedCategoryIds },
      };

      if (promotion) await promotionsService.update(promotion.id, payload);
      else await promotionsService.create(payload);
      
      onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando promoción');
    } finally {
      setSaving(false);
    }
  }

  const filteredProducts = allProducts.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  const filteredCategories = allCategories.filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()));
  const affectedByCategoryCount = allProducts.filter((p) => p.categoryId && selectedCategoryIds.includes(p.categoryId)).length;

  return (
    <div className={styles.formPageWrapper}>
      {/* ── Encabezado Unificado ── */}
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <button type="button" onClick={handleCancel} className={styles.backBtn} aria-label="Volver">
            <ArrowLeft size={14} /> Promociones
          </button>
          <div>
            <h1 className={styles.pageTitle}>
              {promotion ? `Editar promoción: ${promotion.name}` : 'Nueva promoción'}
            </h1>
            <span className={styles.formSubtitle}>
              {selectedProductIds.length} productos directos · {selectedCategoryIds.length} categorías
              {affectedByCategoryCount > 0 && ` (~${affectedByCategoryCount} prods. heredados)`}
            </span>
          </div>
        </div>
        <div className={styles.pageHeaderActions}>
          <button type="button" className={styles.cancelBtn} onClick={handleCancel} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className={styles.submitBtn} onClick={handleSubmit} disabled={saving || !!valueError}>
            {saving ? 'Guardando...' : promotion ? 'Guardar cambios' : 'Crear promoción'}
          </button>
        </div>
      </header>

      {error && (
        <div className={styles.globalError}>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Atención:</span>
          {error}
        </div>
      )}

      {/* ── Pestañas del Formulario ── */}
      <div className={styles.formTabs}>
        <button type="button" className={activeTab === 'details' ? styles.formTabActive : styles.formTab} onClick={() => setActiveTab('details')}>
          Detalles
        </button>
        <button type="button" className={activeTab === 'products' ? styles.formTabActive : styles.formTab} onClick={() => setActiveTab('products')}>
          Productos {selectedProductIds.length > 0 && <span className={styles.tabBadge}>{selectedProductIds.length}</span>}
        </button>
        <button type="button" className={activeTab === 'categories' ? styles.formTabActive : styles.formTab} onClick={() => setActiveTab('categories')}>
          Categorías {selectedCategoryIds.length > 0 && <span className={styles.tabBadge}>{selectedCategoryIds.length}</span>}
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.formUnified} noValidate>
        {/* ── TAB: DETALLES ── */}
        {activeTab === 'details' && (
          <div className={styles.formBody}>
            <section className={styles.formCardSection}>
              <h2 className={styles.formCardTitle}><Tag size={18} /> Información Básica</h2>
              <div className={styles.formGroup}>
                <label htmlFor="promo-name">Nombre de la campaña *</label>
                <input id="promo-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Black Friday 50%, Cyber Week..." />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="promo-desc">Descripción interna</label>
                <textarea id="promo-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles para el administrador" rows={2} />
              </div>
            </section>

            <section className={styles.formCardSection}>
              <h2 className={styles.formCardTitle}><Percent size={18} /> Configuración del Descuento</h2>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="promo-type">Tipo de Descuento *</label>
                  <Dropdown id="promo-type" options={typeOptions} value={type} onChange={(val) => handleTypeChange(val as Promotion['type'])} placeholder="Seleccionar tipo..." />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="promo-value">Valor *</label>
                  <input id="promo-value" type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === 'percentage' ? '0 – 100' : '0'} min="0" step={type === 'percentage' ? '0.01' : '1'} disabled={type === 'bogo'} />
                  <small>{type === 'percentage' ? 'Porcentaje de descuento' : type === 'fixed' ? 'Pesos de descuento' : 'Aplica al 2do artículo'}</small>
                  {valueError && <span className={styles.errorMsg}>{valueError}</span>}
                </div>
              </div>
            </section>

            <section className={styles.formCardSection}>
              <h2 className={styles.formCardTitle}><Calendar size={18} /> Vigencia y Condiciones</h2>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="promo-start">Fecha de Inicio *</label>
                  <DatePicker id="promo-start" value={startDate} onChange={setStartDate} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="promo-end">Fecha de Fin *</label>
                  <DatePicker id="promo-end" value={endDate} onChange={setEndDate} />
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
                  <small style={{ color: 'var(--color-primary)', fontWeight: 500, marginTop: '6px', display: 'block' }}>
                    💡 Si el descuento supera este tope, la tienda ajustará automáticamente el porcentaje visible (Badge) para reflejar el descuento real y evitar publicidad engañosa.
                  </small>
                </div>
              </div>
            </section>

            <section className={styles.formCardSection}>
              <h2 className={styles.formCardTitle}><Settings size={18} /> Avanzado</h2>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="promo-priority">Prioridad de aplicación</label>
                  <input id="promo-priority" type="number" value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="0" />
                  <small>Mayor número = se aplica primero cuando hay conflictos</small>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel} htmlFor="promo-active">
                    <input id="promo-active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                    <span>Promoción activa en la tienda</span>
                  </label>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ─── TAB: PRODUCTOS ─────────────────────────────────────────── */}
        {activeTab === 'products' && (
          <div className={styles.formBody}>
            <section className={styles.formCardSection}>
              <p className={styles.selectorHint}>
                Seleccioná los productos específicos a los que aplica esta promoción.
                También podés aplicarla a categorías enteras en la pestaña <strong>Categorías</strong>.
              </p>
              <div className={styles.searchWrap}>
                <Search size={16} className={styles.searchIcon} />
                <input type="text" className={styles.searchInput} placeholder="Buscar producto..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} autoComplete="off" />
              </div>
              {loadingSelectors ? (
                <p className={styles.loading}>Cargando productos...</p>
              ) : allProducts.length === 0 ? (
                <p className={styles.empty}>No hay productos disponibles</p>
              ) : (
                <>
                  <div className={styles.selectorActions}>
                    <button type="button" className={styles.btnLink} onClick={() => setSelectedProductIds(filteredProducts.map((p) => p.id))}>✓ Seleccionar todos</button>
                    <button type="button" className={styles.btnLink} onClick={() => setSelectedProductIds([])}>✗ Deseleccionar todos</button>
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
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {/* ─── TAB: CATEGORÍAS ────────────────────────────────────────── */}
        {activeTab === 'categories' && (
          <div className={styles.formBody}>
            <section className={styles.formCardSection}>
              <p className={styles.selectorHint}>
                Al seleccionar una categoría, <strong>todos sus productos actuales y futuros</strong> quedan
                incluidos en la promoción automáticamente.
              </p>
              <div className={styles.searchWrap}>
                <Search size={16} className={styles.searchIcon} />
                <input type="text" className={styles.searchInput} placeholder="Buscar categoría..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} autoComplete="off" />
              </div>
              {loadingSelectors ? (
                <p className={styles.loading}>Cargando categorías...</p>
              ) : allCategories.length === 0 ? (
                <p className={styles.empty}>No hay categorías disponibles</p>
              ) : (
                <>
                  <div className={styles.selectorActions}>
                    <button type="button" className={styles.btnLink} onClick={() => setSelectedCategoryIds(filteredCategories.map((c) => c.id))}>✓ Seleccionar todas</button>
                    <button type="button" className={styles.btnLink} onClick={() => setSelectedCategoryIds([])}>✗ Deseleccionar todas</button>
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
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </form>

      <ModalConfirm
        open={showWarning || blocker.state === 'blocked'}
        title="¿Abandonar sin guardar?"
        message="Tenés cambios sin guardar. ¿Estás seguro de que querés abandonar?"
        confirmText="Sí, abandonar"
        cancelText="Seguir editando"
        onConfirm={() => {
          if (blocker.state === 'blocked') blocker.proceed();
          confirmNavigation();
        }}
        onCancel={() => {
          if (blocker.state === 'blocked') blocker.reset();
          cancelNavigation();
        }}
      />
    </div>
  );
};

export default AdminPromotionForm;