import { useState, useEffect, useRef } from 'react';
import type { AdminProduct, VariantGroup } from '../../../context/AdminProductsContext';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminImages } from '../../../context/AdminImagesContext';
import { sanitizeObject } from '../../../utils/security';
import type { ProductImageItem } from '../../../context/AdminImagesContext';
import styles from './AdminProductForm.module.css';
import { ProductImage } from '../../../components/ui/ProductImage';

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
  const {
    images: apiImages,
    isLoading: imagesLoading,
    error: imagesError,
    loadImages,
    addImage,
    updateImage,
    deleteImage,
    clearImages,
  } = useAdminImages();
  const isEdit = !!productId;

  const [form, setForm] = useState<Omit<AdminProduct, 'id'>>(EMPTY);
  const [tagInput, setTagInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  // mapa groupId → valor del input para agregar un valor nuevo
  const [newGroupValues, setNewGroupValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // ── Estado para gestión de imágenes via API (solo cuando se edita) ──────────
  const [imgNewUrl, setImgNewUrl] = useState('');
  const [imgNewAlt, setImgNewAlt] = useState('');
  const [imgError, setImgError] = useState('');
  const [showAddImgForm, setShowAddImgForm] = useState(false);
  const [editingImgId, setEditingImgId] = useState<string | null>(null);
  const [editingImgUrl, setEditingImgUrl] = useState('');
  const [editingImgAlt, setEditingImgAlt] = useState('');
  const [editingImgError, setEditingImgError] = useState('');
  const [savingImgId, setSavingImgId] = useState<string | null>(null);
  const [deletingImgId, setDeletingImgId] = useState<string | null>(null);
  const addImgUrlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (productId) {
      const p = getProduct(productId);
      if (p) {
        // Solo usar id si es necesario, eliminamos variable no usada
        const { id, ...rest } = p;
        setTimeout(() => setForm(rest), 0); // Evita render en cascada
      }
      // Cargar imágenes vía API para modo edición
      loadImages(productId);
    } else {
      setForm(EMPTY);
      clearImages();
    }
    setError('');
    setFieldErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // ── Funciones de gestión de imágenes via API ────────────────────────────────

  const handleApiAddImage = async () => {
    const url = imgNewUrl.trim();
    setImgError('');
    if (!url) return setImgError('La URL es obligatoria');
    if (!url.startsWith('http')) return setImgError('La URL debe ser válida (empezar con http)');
    if (!productId) return;

    try {
      await addImage(productId, { url, altText: imgNewAlt.trim() || undefined });
      setImgNewUrl('');
      setImgNewAlt('');
      setShowAddImgForm(false);
    } catch {
      // error guardado en contexto
    }
  };

  const handleApiStartEdit = (img: ProductImageItem) => {
    setEditingImgId(img.id);
    setEditingImgUrl(img.url);
    setEditingImgAlt(img.altText ?? '');
    setEditingImgError('');
  };

  const handleApiCommitEdit = async (imageId: string) => {
    const url = editingImgUrl.trim();
    setEditingImgError('');
    if (!url) return setEditingImgError('La URL es obligatoria');
    if (!url.startsWith('http')) return setEditingImgError('La URL debe ser válida');
    if (!productId) return;

    setSavingImgId(imageId);
    try {
      await updateImage(productId, imageId, {
        url,
        altText: editingImgAlt.trim() || undefined,
      });
      setEditingImgId(null);
    } catch {
      // error en contexto
    } finally {
      setSavingImgId(null);
    }
  };

  const handleApiDeleteImage = async (imageId: string) => {
    if (!productId || !window.confirm('¿Eliminar esta imagen?')) return;
    setDeletingImgId(imageId);
    try {
      await deleteImage(productId, imageId);
    } catch {
      // error en contexto
    } finally {
      setDeletingImgId(null);
    }
  };

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    // Limpiar error del campo cuando cambia
    if (fieldErrors[key]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'El nombre es obligatorio';
    if (!form.price || form.price <= 0) errors.price = 'El precio debe ser mayor a 0';
    if (!form.category.id) errors.category = 'Seleccioná una categoría';

    // Validaciones opcionales pero con formato
    if (form.discount !== undefined && (form.discount < 0 || form.discount > 100)) {
      errors.discount = 'El descuento debe estar entre 0 y 100';
    }

    if (form.originalPrice !== undefined && form.originalPrice <= 0) {
      errors.originalPrice = 'El precio original debe ser mayor a 0';
    }

    if (form.stock < 0) {
      errors.stock = 'El stock no puede ser negativo';
    }

    // Validar URLs de imágenes en modo creación
    if (!isEdit) {
      const invalidImgs = form.images.filter(url => url.trim() !== '' && !url.startsWith('http'));
      if (invalidImgs.length > 0) {
        errors.images = 'Todas las URLs de imágenes deben ser válidas (http/https)';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setError('');
    setSaving(true);

    // Sanitización de inputs antes de enviar al servidor para prevenir XSS
    const sanitizedForm = sanitizeObject(form);

    try {
      if (isEdit && productId) {
        // Al editar, las imágenes se gestionan vía la API de imágenes;
        // no incluimos el campo images en el update del producto
        const { images: _omitted, ...formWithoutImages } = sanitizedForm;
        void _omitted;
        await updateProduct(productId, formWithoutImages as Partial<AdminProduct>);
      } else {
        // Al crear, enviamos las URLs capturadas en el formulario
        await addProduct(sanitizedForm);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el producto');
    } finally {
      setSaving(false);
    }
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
    <div
      className={styles.backdrop}
      onClick={e => e.target === e.currentTarget && onClose()}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Escape' || e.key === 'Enter') && onClose()}
    >
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
                <label className={styles.label} htmlFor="product-name">Nombre *</label>
                <input className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`} id="product-name" value={form.name}
                  onChange={e => set('name', e.target.value)} required />
                {fieldErrors.name && <span className={styles.errorText}>{fieldErrors.name}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="product-sku">SKU</label>
                <input className={styles.input} id="product-sku" value={form.sku}
                  onChange={e => set('sku', e.target.value)} />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="product-short-desc">Descripción corta</label>
              <input className={styles.input} id="product-short-desc" value={form.shortDescription}
                onChange={e => set('shortDescription', e.target.value)} />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="product-desc">Descripción completa</label>
              <textarea className={styles.textarea} id="product-desc" rows={4} value={form.description}
                onChange={e => set('description', e.target.value)} />
            </div>
          </fieldset>

          {/* ── Precio y stock ── */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Precio y stock</legend>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="product-price">Precio *</label>
                <input className={`${styles.input} ${fieldErrors.price ? styles.inputError : ''}`} id="product-price" type="number" min={0} step={0.01}
                  value={form.price} onChange={e => set('price', Number(e.target.value))} required />
                {fieldErrors.price && <span className={styles.errorText}>{fieldErrors.price}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="product-original-price">Precio original</label>
                <input className={`${styles.input} ${fieldErrors.originalPrice ? styles.inputError : ''}`} id="product-original-price" type="number" min={0} step={0.01}
                  value={form.originalPrice ?? ''} onChange={e => set('originalPrice', e.target.value ? Number(e.target.value) : undefined)} />
                {fieldErrors.originalPrice && <span className={styles.errorText}>{fieldErrors.originalPrice}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="product-discount">Descuento (%)</label>
                <input className={`${styles.input} ${fieldErrors.discount ? styles.inputError : ''}`} id="product-discount" type="number" min={0} max={100}
                  value={form.discount ?? ''} onChange={e => set('discount', e.target.value ? Number(e.target.value) : undefined)} />
                {fieldErrors.discount && <span className={styles.errorText}>{fieldErrors.discount}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="product-stock">Stock</label>
                <input className={`${styles.input} ${fieldErrors.stock ? styles.inputError : ''}`} id="product-stock" type="number" min={0}
                  value={form.stock} onChange={e => set('stock', Number(e.target.value))} />
                {fieldErrors.stock && <span className={styles.errorText}>{fieldErrors.stock}</span>}
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
              <label className={styles.label} htmlFor="product-category">Categoría *</label>
              <select className={`${styles.input} ${fieldErrors.category ? styles.inputError : ''}`} id="product-category" value={form.category.id}
                onChange={e => {
                  const cat = categories.find(c => c.id === e.target.value);
                  if (cat) set('category', cat);
                }}>
                <option value="">Seleccioná una categoría...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {fieldErrors.category && <span className={styles.errorText}>{fieldErrors.category}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="product-tags">Etiquetas</label>
              <div className={styles.tagRow}>
                <input className={styles.input} id="product-tags" value={tagInput}
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

            {isEdit ? (
              /* ── Modo edición: gestión via API ─────────────────────────── */
              <div className={styles.imgManager}>
                {imagesError && (
                  <p className={styles.imgError} aria-live="polite">Error: {imagesError}</p>
                )}
                {imagesLoading && apiImages.length === 0 ? (
                  <p className={styles.imgHint}>Cargando imágenes...</p>
                ) : apiImages.length === 0 ? (
                  <p className={styles.imgHint}>Sin imágenes. Agregá la primera abajo.</p>
                ) : (
                  <div className={styles.imgList}>
                    {apiImages.map(img => (
                      <div key={img.id} className={styles.imgRow}>
                        {/* Miniatura */}
                        <div className={styles.imgThumb}>
                          {img.url
                            ? <ProductImage
                                src={img.url}
                                alt={img.altText ?? 'imagen'}
                                className={styles.imgThumbImg}
                                width={60}
                                height={45}
                                placeholder={'data:image/svg+xml,%3Csvg width="60" height="45" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="60" height="45" fill="%23f3f3f3"/%3E%3C/svg%3E'}
                              />
                            : <span className={styles.imgThumbEmpty}>?</span>
                          }
                        </div>

                        {editingImgId === img.id ? (
                          /* Edición inline */
                          <div className={styles.imgEditInline}>
                            <input
                              className={`${styles.input} ${editingImgError ? styles.inputError : ''}`}
                              value={editingImgUrl}
                              onChange={e => setEditingImgUrl(e.target.value)}
                              placeholder="URL de la imagen *"
                              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApiCommitEdit(img.id))}
                            />
                            {editingImgError && <span className={styles.errorText}>{editingImgError}</span>}
                            <input
                              className={styles.input}
                              value={editingImgAlt}
                              onChange={e => setEditingImgAlt(e.target.value)}
                              placeholder="Texto alt (opcional)"
                              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApiCommitEdit(img.id))}
                            />
                            <div className={styles.imgEditActions}>
                              <button type="button" className={styles.imgSaveBtn}
                                onClick={() => handleApiCommitEdit(img.id)}
                                disabled={savingImgId === img.id || !editingImgUrl.trim()}>
                                {savingImgId === img.id ? '...' : 'Guardar'}
                              </button>
                              <button type="button" className={styles.imgCancelBtn}
                                onClick={() => setEditingImgId(null)}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Vista normal */
                          <div className={styles.imgInfo}>
                            <span className={styles.imgUrl} title={img.url}>{img.url}</span>
                            {img.altText && <span className={styles.imgAlt}>{img.altText}</span>}
                          </div>
                        )}

                        {/* Acciones (editar / eliminar) – solo si no está editando */}
                        {editingImgId !== img.id && (
                          <div className={styles.imgActions}>
                            <button type="button" className={styles.imgEditBtn}
                              onClick={() => handleApiStartEdit(img)}
                              title="Editar URL">
                              ✏️
                            </button>
                            <button type="button" className={styles.imgDeleteBtn}
                              onClick={() => handleApiDeleteImage(img.id)}
                              disabled={deletingImgId === img.id}
                              title="Eliminar imagen">
                              {deletingImgId === img.id ? '...' : '✕'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulario para agregar nueva imagen */}
                {showAddImgForm ? (
                  <div className={styles.imgAddForm}>
                    <label htmlFor="img-new-url" className="sr-only">URL de la imagen *</label>
                    <input
                      id="img-new-url"
                      ref={addImgUrlRef}
                      className={`${styles.input} ${imgError ? styles.inputError : ''}`}
                      value={imgNewUrl}
                      onChange={e => setImgNewUrl(e.target.value)}
                      placeholder="URL de la imagen *"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApiAddImage())}
                    />
                    {imgError && <span className={styles.errorText} aria-live="polite">{imgError}</span>}
                    <label htmlFor="img-new-alt" className="sr-only">Texto alternativo (opcional)</label>
                    <input
                      id="img-new-alt"
                      className={styles.input}
                      value={imgNewAlt}
                      onChange={e => setImgNewAlt(e.target.value)}
                      placeholder="Texto alternativo (opcional)"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApiAddImage())}
                    />
                    <div className={styles.imgEditActions}>
                      <button type="button" className={styles.imgSaveBtn}
                        onClick={handleApiAddImage}
                        disabled={!imgNewUrl.trim() || imagesLoading}
                        aria-label="Agregar imagen"
                      >
                        {imagesLoading ? 'Agregando...' : 'Agregar'}
                      </button>
                      <button type="button" className={styles.imgCancelBtn}
                        onClick={() => { setShowAddImgForm(false); setImgNewUrl(''); setImgNewAlt(''); setImgError(''); }}
                        aria-label="Cancelar agregar imagen"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className={styles.addBtn}
                    onClick={() => {
                      setShowAddImgForm(true);
                      setTimeout(() => addImgUrlRef.current?.focus(), 50);
                    }}
                    aria-label="Mostrar formulario para agregar imagen"
                  >
                    + Agregar imagen
                  </button>
                )}
              </div>
            ) : (
              /* ── Modo creación: URLs en estado local ─────────────────────── */
              <>
                {form.images.map((img, i) => (
                  <div key={i} className={styles.tagRow}>
                    <label htmlFor={`img-url-${i}`} className="sr-only">URL de la imagen</label>
                    <input className={`${styles.input} ${fieldErrors.images ? styles.inputError : ''}`} id={`img-url-${i}`} value={img}
                      onChange={e => setImage(i, e.target.value)}
                      placeholder="URL de la imagen" />
                    {form.images.length > 1 && (
                      <button type="button" className={styles.removeBtn} onClick={() => removeImageSlot(i)} aria-label={`Eliminar imagen ${i + 1}`}>✕</button>
                    )}
                  </div>
                ))}
                {fieldErrors.images && <span className={styles.errorText} aria-live="polite">{fieldErrors.images}</span>}
                <button type="button" className={styles.addBtn} onClick={addImageSlot} aria-label="Agregar campo de imagen">+ Agregar imagen</button>
              </>
            )}
          </fieldset>

          {/* ── Características ── */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Características</legend>
            <div className={styles.tagRow}>
              <input className={styles.input} value={featureInput}
                onChange={e => setFeatureInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                placeholder="Ej: Material: acero inoxidable" />
              <button type="button" className={styles.addBtn} onClick={addFeature} aria-label="Agregar característica">＋</button>
            </div>
            {(form.features ?? []).length > 0 && (
              <ul className={styles.featureList}>
                {(form.features ?? []).map((f, i) => (
                  <li key={i} className={styles.featureItem}>
                    <span>{f}</span>
                    <button type="button" onClick={() => removeFeature(i)} className={styles.tagRemove} aria-label={`Eliminar característica ${f}`}>✕</button>
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
              <button type="button" className={styles.addBtn} onClick={addVariantGroup} aria-label="Agregar grupo de variantes">+ Grupo</button>
            </div>

            {/* Grupos existentes */}
            {(form.variants ?? []).map(group => (
              <div key={group.id} className={styles.variantGroup}>
                <div className={styles.variantGroupHeader}>
                  <span className={styles.variantGroupName}>{group.name}</span>
                  <button type="button" className={styles.removeBtn} onClick={() => removeVariantGroup(group.id)} aria-label={`Eliminar grupo ${group.name}`}>✕</button>
                </div>
                <div className={styles.tags}>
                  {group.values.map(val => (
                    <span key={val} className={styles.tag}>
                      {val}
                      <button type="button" className={styles.tagRemove} onClick={() => removeVariantValue(group.id, val)} aria-label={`Eliminar variante ${val}`}>✕</button>
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
                  <button type="button" className={styles.addBtn} onClick={() => addVariantValue(group.id)} aria-label={`Agregar valor a ${group.name}`}>＋</button>
                </div>
              </div>
            ))}
          </fieldset>

          {error && <div className={styles.error} aria-live="polite">{error}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
