import { useState, useEffect } from 'react';
import type { AdminProduct, VariantGroup } from '../../../context/AdminProductsContext';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import styles from './AdminProductForm.module.css';

interface Props {
  productId?: string | null;
  onClose: () => void;
}

const EMPTY: Omit<AdminProduct, 'id'> = {
  name: '',
  slug: '',
  description: '',
  shortDescription: '',
  price: 0,
  originalPrice: undefined,
  discount: undefined,
  images: [''],
  category: { id: '', name: '', slug: '' },
  tags: [],
  rating: 0,
  reviewCount: 0,
  inStock: true,
  sku: '',
  features: [],
  stock: 0,
  variants: [],
};

export function AdminProductForm({ productId, onClose }: Props) {
  const { addProduct, updateProduct, getProduct } = useAdminProducts();
  const { categories } = useAdminCategories();
  const isEdit = !!productId;

  const [form, setForm] = useState<Omit<AdminProduct, 'id'>>(EMPTY);
  const [tagInput, setTagInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  // mapa groupId → valor del input para agregar un valor nuevo
  const [newGroupValues, setNewGroupValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (productId) {
      const p = getProduct(productId);
      if (p) {
        const { id: _id, ...rest } = p;
        setForm(rest);
      }
    } else {
      setForm(EMPTY);
    }
  }, [productId]);

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('El nombre es obligatorio');
    if (!form.price || form.price <= 0) return setError('El precio debe ser mayor a 0');
    if (!form.category.id) return setError('Seleccioná una categoría');
    setError('');
    if (isEdit && productId) {
      updateProduct(productId, form);
    } else {
      addProduct(form);
    }
    onClose();
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]);
    setTagInput('');
  };

  const removeTag = (tag: string) => set('tags', form.tags.filter(t => t !== tag));

  const addFeature = () => {
    const f = featureInput.trim();
    if (f) set('features', [...(form.features ?? []), f]);
    setFeatureInput('');
  };

  const removeFeature = (i: number) =>
    set('features', (form.features ?? []).filter((_, idx) => idx !== i));

  const addVariantGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    const g: VariantGroup = { id: `g-${Date.now()}`, name, values: [] };
    set('variants', [...(form.variants ?? []), g]);
    setNewGroupName('');
  };

  const removeVariantGroup = (groupId: string) =>
    set('variants', (form.variants ?? []).filter(g => g.id !== groupId));

  const addVariantValue = (groupId: string) => {
    const val = (newGroupValues[groupId] ?? '').trim();
    if (!val) return;
    set('variants', (form.variants ?? []).map(g =>
      g.id === groupId && !g.values.includes(val)
        ? { ...g, values: [...g.values, val] }
        : g
    ));
    setNewGroupValues(prev => ({ ...prev, [groupId]: '' }));
  };

  const removeVariantValue = (groupId: string, value: string) =>
    set('variants', (form.variants ?? []).map(g =>
      g.id === groupId ? { ...g, values: g.values.filter(v => v !== value) } : g
    ));

  const setImage = (i: number, val: string) => {
    const imgs = [...form.images];
    imgs[i] = val;
    set('images', imgs);
  };

  const addImageSlot = () => set('images', [...form.images, '']);
  const removeImageSlot = (i: number) => set('images', form.images.filter((_, idx) => idx !== i));

  return (
    <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>
            {isEdit ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Cerrar">✕</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>

          {/* ── Información básica ── */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Información básica</legend>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Nombre *</label>
                <input className={styles.input} value={form.name}
                  onChange={e => set('name', e.target.value)} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>SKU</label>
                <input className={styles.input} value={form.sku}
                  onChange={e => set('sku', e.target.value)} />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Descripción corta</label>
              <input className={styles.input} value={form.shortDescription}
                onChange={e => set('shortDescription', e.target.value)} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Descripción completa</label>
              <textarea className={styles.textarea} rows={4} value={form.description}
                onChange={e => set('description', e.target.value)} />
            </div>
          </fieldset>

          {/* ── Precio y stock ── */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Precio y stock</legend>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Precio *</label>
                <input className={styles.input} type="number" min={0} step={0.01}
                  value={form.price} onChange={e => set('price', Number(e.target.value))} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Precio original</label>
                <input className={styles.input} type="number" min={0} step={0.01}
                  value={form.originalPrice ?? ''} onChange={e => set('originalPrice', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Descuento (%)</label>
                <input className={styles.input} type="number" min={0} max={100}
                  value={form.discount ?? ''} onChange={e => set('discount', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Stock</label>
                <input className={styles.input} type="number" min={0}
                  value={form.stock} onChange={e => set('stock', Number(e.target.value))} />
              </div>
            </div>

            <div className={styles.checkRow}>
              <input type="checkbox" id="inStock" checked={form.inStock}
                onChange={e => set('inStock', e.target.checked)} />
              <label htmlFor="inStock" className={styles.checkLabel}>Disponible en stock</label>
            </div>
          </fieldset>

          {/* ── Categoría y tags ── */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Categoría y etiquetas</legend>

            <div className={styles.field}>
              <label className={styles.label}>Categoría *</label>
              <select className={styles.input} value={form.category.id}
                onChange={e => {
                  const cat = categories.find(c => c.id === e.target.value);
                  if (cat) set('category', cat);
                }}>
                <option value="">Seleccioná una categoría...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Etiquetas</label>
              <div className={styles.tagRow}>
                <input className={styles.input} value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Ej: destacado, oferta, nuevo..." />
                <button type="button" className={styles.addBtn} onClick={addTag}>＋</button>
              </div>
              {form.tags.length > 0 && (
                <div className={styles.tags}>
                  {form.tags.map(t => (
                    <span key={t} className={styles.tag}>
                      {t}
                      <button type="button" onClick={() => removeTag(t)} className={styles.tagRemove}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </fieldset>

          {/* ── Imágenes ── */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Imágenes</legend>
            {form.images.map((img, i) => (
              <div key={i} className={styles.tagRow}>
                <input className={styles.input} value={img}
                  onChange={e => setImage(i, e.target.value)}
                  placeholder="URL de la imagen" />
                {form.images.length > 1 && (
                  <button type="button" className={styles.removeBtn} onClick={() => removeImageSlot(i)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className={styles.addBtn} onClick={addImageSlot}>+ Agregar imagen</button>
          </fieldset>

          {/* ── Características ── */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Características</legend>
            <div className={styles.tagRow}>
              <input className={styles.input} value={featureInput}
                onChange={e => setFeatureInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                placeholder="Ej: Material: acero inoxidable" />
              <button type="button" className={styles.addBtn} onClick={addFeature}>＋</button>
            </div>
            {(form.features ?? []).length > 0 && (
              <ul className={styles.featureList}>
                {(form.features ?? []).map((f, i) => (
                  <li key={i} className={styles.featureItem}>
                    <span>{f}</span>
                    <button type="button" onClick={() => removeFeature(i)} className={styles.tagRemove}>✕</button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          {/* ── Variantes ── */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Variantes</legend>
            <p className={styles.fieldHint}>Agrupá opciones como Color o Tamaño. Podés gestionar variantes en detalle desde la sección <em>Variantes</em> del menú.</p>

            {/* Agregar nuevo grupo */}
            <div className={styles.tagRow}>
              <input
                className={styles.input}
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVariantGroup())}
                placeholder="Nombre del grupo, ej: Color, Tamaño..."
              />
              <button type="button" className={styles.addBtn} onClick={addVariantGroup}>+ Grupo</button>
            </div>

            {/* Grupos existentes */}
            {(form.variants ?? []).map(group => (
              <div key={group.id} className={styles.variantGroup}>
                <div className={styles.variantGroupHeader}>
                  <span className={styles.variantGroupName}>{group.name}</span>
                  <button type="button" className={styles.removeBtn} onClick={() => removeVariantGroup(group.id)}>✕</button>
                </div>
                <div className={styles.tags}>
                  {group.values.map(val => (
                    <span key={val} className={styles.tag}>
                      {val}
                      <button type="button" className={styles.tagRemove} onClick={() => removeVariantValue(group.id, val)}>✕</button>
                    </span>
                  ))}
                </div>
                <div className={styles.tagRow}>
                  <input
                    className={styles.input}
                    value={newGroupValues[group.id] ?? ''}
                    onChange={e => setNewGroupValues(prev => ({ ...prev, [group.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVariantValue(group.id))}
                    placeholder={`Agregar valor a ${group.name}...`}
                  />
                  <button type="button" className={styles.addBtn} onClick={() => addVariantValue(group.id)}>＋</button>
                </div>
              </div>
            ))}
          </fieldset>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitBtn}>
              {isEdit ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
