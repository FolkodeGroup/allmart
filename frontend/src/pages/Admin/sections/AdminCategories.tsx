import { useState, useRef } from 'react';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { FolderSearch, AlertCircle } from 'lucide-react';
import sectionStyles from './AdminSection.module.css';
import styles from './AdminCategories.module.css';

const EMPTY = { name: '', description: '', image: '', itemCount: 0 };

export function AdminCategories() {
  const { categories, addCategory, updateCategory, deleteCategory, uploadCategoryImage, isLoading, error: apiError } = useAdminCategories();
  const { products, updateProduct } = useAdminProducts();
  const { can } = useAdminAuth();

  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [assignCatId, setAssignCatId] = useState<string | null>(null);

  // ── Gestión de imágenes ──
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openNew = () => {
    setEditId(null);
    setForm(EMPTY);
    setError('');
    setFieldErrors({});
    setShowForm(true);
  };

  const openEdit = (id: string) => {
    const c = categories.find(c => c.id === id);
    if (!c) return;
    setEditId(id);
    setForm({ name: c.name, description: c.description ?? '', image: c.image ?? '', itemCount: c.itemCount ?? 0 });
    setError('');
    setFieldErrors({});
    setShowForm(true);
  };

  const setField = (field: keyof typeof form, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) {
      errors.name = 'El nombre de la categoría es obligatorio';
    } else if (form.name.trim().length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndUploadImage(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    await processAndUploadImage(file);
  };

  const processAndUploadImage = async (file: File) => {
    // Si estamos editando, subimos de inmediato
    if (editId) {
      setIsUploading(true);
      setError('');
      try {
        const url = await uploadCategoryImage(editId, file);
        setForm(f => ({ ...f, image: url }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al subir imagen');
      } finally {
        setIsUploading(false);
      }
    } else {
      // Si es nueva categoría, solo previsualizamos (el backend requiere ID para guardar el BYTEA)
      // OPCIÓN: Podríamos guardar el File en el estado y subirlo DESPUÉS de crear la categoría
      // Pero para simplificar y mantener consistencia con Products, el backend requiere el ID.
      // Así que usaremos una URL temporal o alertaremos que debe crearse primero.
      setError('Primero creá la categoría y luego subí su imagen.');
    }
  };

  const handleRemoveImage = () => {
    setForm(f => ({ ...f, image: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setError('');
    setIsSubmitting(true);
    try {
      if (editId) {
        await updateCategory(editId, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          image: form.image.trim() || undefined,
        });
      } else {
        await addCategory({
          name: form.name.trim(),
          slug: '',
          description: form.description.trim() || undefined,
          image: form.image.trim() || undefined,
          itemCount: 0,
        });
      }
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la categoría');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error al eliminar categoría:', err);
    }
  };

  // Productos de una categoría
  const productsOfCat = (catId: string) => products.filter(p => p.category.id === catId);

  // Reasignar producto a otra categoría
  const reassignProduct = (productId: string, newCatId: string) => {
    const newCat = categories.find(c => c.id === newCatId);
    if (!newCat) return;
    updateProduct(productId, { category: newCat }).catch((err) =>
      console.error('Error al reasignar categoría:', err),
    );
  };

  return (
    <div className={sectionStyles.page}>

      {/* Header */}
      <div className={sectionStyles.header}>
        <div className={styles.headerTop}>
          <div>
            <span className={sectionStyles.label}>Administración</span>
            <h1 className={sectionStyles.title}>
              <span className={sectionStyles.icon}>🗂️</span> Categorías
            </h1>
            <p className={sectionStyles.subtitle}>
              Creá, editá y eliminá categorías. Asigná productos a cada una.
            </p>
          </div>
          {can('categories.create') && (
            <button className={styles.newBtn} onClick={openNew}>+ Nueva categoría</button>
          )}
        </div>
      </div>

      {/* Listado */}
      {isLoading && !categories.length ? (
        <LoadingSpinner message="Cargando categorías..." size="lg" />
      ) : apiError ? (
        <EmptyState 
          icon={<AlertCircle size={48} color="#ef4444" />}
          title="Error al cargar categorías"
          description={apiError}
          action={{ label: 'Reintentar', onClick: () => window.location.reload() }}
        />
      ) : categories.length === 0 ? (
        <EmptyState 
          icon={<FolderSearch size={48} color="#94a3b8" />}
          title="No hay categorías"
          description="Todavía no creaste ninguna categoría para organizar tus productos. ¡Empezá ahora!"
          action={can('categories.create') ? { label: 'Nueva Categoría', onClick: openNew } : undefined}
        />
      ) : (
        <div className={styles.grid}>
          {categories.map(cat => {
            const catProducts = productsOfCat(cat.id);
            return (
              <div key={cat.id} className={styles.card}>
                {/* Imagen preview */}
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className={styles.cardImg}
                    onError={e => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <div className={styles.cardImgPlaceholder}>🗂️</div>
                )}

                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <div>
                      <h3 className={styles.cardName}>{cat.name}</h3>
                      <span className={styles.cardSlug}>/{cat.slug}</span>
                    </div>
                    <div className={styles.cardActions}>
                      {can('categories.edit') && (
                        <button className={styles.editBtn} onClick={() => openEdit(cat.id)} title="Editar">✏️</button>
                      )}
                      {can('categories.delete') && (
                        deleteConfirm === cat.id ? (
                          <>
                            <button className={styles.confirmDeleteBtn} onClick={() => handleDelete(cat.id)}>Confirmar</button>
                            <button className={styles.cancelDeleteBtn} onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                          </>
                        ) : (
                          <button className={styles.deleteBtn} onClick={() => setDeleteConfirm(cat.id)} title="Eliminar">🗑️</button>
                        )
                      )}
                    </div>
                  </div>

                  {cat.description && <p className={styles.cardDesc}>{cat.description}</p>}

                  {/* Productos de esta categoría */}
                  <div className={styles.productSection}>
                    <button
                      className={styles.toggleProductsBtn}
                      onClick={() => setAssignCatId(assignCatId === cat.id ? null : cat.id)}
                    >
                      📦 {catProducts.length} producto{catProducts.length !== 1 ? 's' : ''}
                      {assignCatId === cat.id ? ' ▲' : ' ▼'}
                    </button>

                    {assignCatId === cat.id && (
                      <div className={styles.productList}>
                        {catProducts.length === 0 ? (
                          <p className={styles.noProducts}>Sin productos asignados.</p>
                        ) : (
                          catProducts.map(p => (
                            <div key={p.id} className={styles.productRow}>
                              <span className={styles.productName}>{p.name}</span>
                              <select
                                className={styles.reassignSelect}
                                value={p.category.id}
                                onChange={e => reassignProduct(p.id, e.target.value)}
                              >
                                {categories.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal formulario */}
      {showForm && (
        <div
          className={styles.backdrop}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}
          role="button"
          tabIndex={0}
          onKeyDown={e => (e.key === 'Escape' || e.key === 'Enter') && setShowForm(false)}
        >
            <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>{editId ? 'Editar categoría' : 'Nueva categoría'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)} type="button">✕</button>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label}>Nombre *</label>
                <input 
                  className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`} 
                  value={form.name}
                  onChange={e => setField('name', e.target.value)} 
                  required 
                />
                {fieldErrors.name && <span className={styles.errorText}>{fieldErrors.name}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="category-description">Descripción</label>
                <textarea 
                  className={styles.textarea} 
                  id="category-description" 
                  rows={3}
                  value={form.description}
                  onChange={e => setField('description', e.target.value)} 
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Imagen de categoría</label>
                {form.image ? (
                  <div className={styles.previewContainer}>
                    <img src={form.image} alt="Vista previa" className={styles.previewImg} />
                    <button type="button" className={styles.removeImgBtn} onClick={handleRemoveImage} title="Quitar imagen">✕</button>
                    {isUploading && (
                      <div className={styles.uploadingOverlay}>
                        <div className={styles.spinner}></div>
                        Subiendo...
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <span className={styles.dropZoneIcon}>📁</span>
                    <span className={styles.dropZoneText}>
                      Arrastrá una imagen o hacé clic <br /> para subir
                    </span>
                    <span className={styles.dropZoneHint}>
                      Se convertirá a WebP automáticamente.
                    </span>
                    {!editId && <span className={styles.dropZoneHint} style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Se habilitará al guardar</span>}
                  </div>
                )}
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)} disabled={isSubmitting}>Cancelar</button>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Procesando...' : (editId ? 'Guardar cambios' : 'Crear categoría')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
