import { useState } from 'react';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import sectionStyles from './AdminSection.module.css';
import styles from './AdminCategories.module.css';

const EMPTY = { name: '', description: '', image: '', itemCount: 0 };

export function AdminCategories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useAdminCategories();
  const { products, updateProduct } = useAdminProducts();
  const { can } = useAdminAuth();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [assignCatId, setAssignCatId] = useState<string | null>(null);

  const openNew = () => { setEditId(null); setForm(EMPTY); setError(''); setShowForm(true); };
  const openEdit = (id: string) => {
    const c = categories.find(c => c.id === id);
    if (!c) return;
    setEditId(id);
    setForm({ name: c.name, description: c.description ?? '', image: c.image ?? '', itemCount: c.itemCount ?? 0 });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('El nombre es obligatorio');
    setError('');
    if (editId) {
      updateCategory(editId, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        image: form.image.trim() || undefined,
      });
    } else {
      addCategory({
        name: form.name.trim(),
        slug: '',
        description: form.description.trim() || undefined,
        image: form.image.trim() || undefined,
        itemCount: 0,
      });
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    // Productos con esta categoría quedan sin categoría asignada
    deleteCategory(id);
    setDeleteConfirm(null);
  };

  // Productos de una categoría
  const productsOfCat = (catId: string) => products.filter(p => p.category.id === catId);

  // Reasignar producto a otra categoría
  const reassignProduct = (productId: string, newCatId: string) => {
    const newCat = categories.find(c => c.id === newCatId);
    if (!newCat) return;
    updateProduct(productId, { category: newCat });
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
      {categories.length === 0 ? (
        <div className={sectionStyles.emptyState}>
          <span className={sectionStyles.emptyIcon}>🗂️</span>
          <p className={sectionStyles.emptyText}>No hay categorías creadas.</p>
        </div>
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
        <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>{editId ? 'Editar categoría' : 'Nueva categoría'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label}>Nombre *</label>
                <input className={styles.input} value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Descripción</label>
                <input className={styles.input} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>URL de imagen</label>
                <input className={styles.input} value={form.image}
                  onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                  placeholder="https://..." />
                {form.image && (
                  <img src={form.image} alt="preview" className={styles.imagePreview}
                    onError={e => (e.currentTarget.style.display = 'none')} />
                )}
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className={styles.submitBtn}>{editId ? 'Guardar cambios' : 'Crear categoría'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
