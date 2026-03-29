/**
 * features/admin/collections/AdminCollectionForm.tsx
 * Formulario para crear/editar colecciones.
 */

import React, { useState, useEffect } from 'react';
import { collectionsService, Collection } from './collectionsService';
import styles from './AdminCollections.module.css';

interface Props {
  collection?: Collection | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const AdminCollectionForm: React.FC<Props> = ({ collection, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    displayPosition: 'home' as const,
    displayOrder: 0,
    imageUrl: '',
    isActive: true,
    productIds: [] as string[],
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name,
        slug: collection.slug,
        description: collection.description || '',
        displayPosition: collection.displayPosition,
        displayOrder: collection.displayOrder,
        imageUrl: collection.imageUrl || '',
        isActive: collection.isActive,
        productIds: collection.products?.map((p) => p.id) || [],
      });
    }
  }, [collection]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        setError('El nombre es requerido');
        return;
      }

      const payload = {
        ...formData,
        displayOrder: Number(formData.displayOrder),
      };

      if (collection) {
        await collectionsService.update(collection.id, payload);
      } else {
        await collectionsService.create(payload);
      }

      onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando colección');
    } finally {
      setLoading(false);
    }
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
  }

  return (
    <div className={styles.container}>
      <div className={styles.formHeader}>
        <h1>{collection ? 'Editar Colección' : 'Nueva Colección'}</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Nombre *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              setFormData({
                ...formData,
                name,
                slug: !collection ? generateSlug(name) : formData.slug,
              });
            }}
            placeholder="Ej: Ofertas del Mes"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Slug *</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="Ej: ofertas-del-mes"
          />
          <small>URL amigable para acceder a esta colección</small>
        </div>

        <div className={styles.formGroup}>
          <label>Descripción</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detalles y descripción"
            rows={3}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Posición de Display *</label>
            <select
              value={formData.displayPosition}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  displayPosition: e.target.value as any,
                })
              }
            >
              <option value="home">Home</option>
              <option value="category">Categoría</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Orden de Display</label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) =>
                setFormData({ ...formData, displayOrder: Number(e.target.value) })
              }
              placeholder="0"
            />
            <small>Menor número aparece primero</small>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>URL de Imagen</label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div className={styles.formGroup}>
          <label>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            Activo
          </label>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Guardando...' : collection ? 'Actualizar' : 'Crear'}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCollectionForm;
