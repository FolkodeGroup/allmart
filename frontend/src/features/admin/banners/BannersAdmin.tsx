/**
 * features/admin/banners/BannersAdmin.tsx
 * Página de administración de banners de la homepage
 */

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Plus, Edit2, Eye, EyeOff } from 'lucide-react';
import { bannersAdminService, type AdminBanner } from './bannersAdminService';
import { Button } from '../../../components/ui/Button/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import styles from './BannersAdmin.module.css';
import sectionStyles from '../../../pages/Admin/sections/AdminSection.module.css';

interface FormData {
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  displayOrder: number;
  isActive: boolean;
}

export function BannersAdmin() {
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    try {
      setLoading(true);
      const data = await bannersAdminService.getAllBanners();
      setBanners(data.sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (err) {
      toast.error('Error al cargar banners');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      link: '',
      displayOrder: 0,
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(banner: AdminBanner) {
    setFormData({
      title: banner.title,
      description: banner.description || '',
      imageUrl: banner.imageUrl,
      link: banner.link || '',
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
    });
    setEditingId(banner.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.imageUrl.trim()) {
      toast.error('Título e imagen son requeridos');
      return;
    }

    try {
      if (editingId) {
        await bannersAdminService.updateBanner(editingId, formData);
        toast.success('Banner actualizado');
      } else {
        await bannersAdminService.createBanner(formData);
        toast.success('Banner creado');
      }
      resetForm();
      loadBanners();
    } catch (err) {
      toast.error(editingId ? 'Error al actualizar banner' : 'Error al crear banner');
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este banner?')) {
      return;
    }

    try {
      await bannersAdminService.deleteBanner(id);
      toast.success('Banner eliminado');
      loadBanners();
    } catch (err) {
      toast.error('Error al eliminar banner');
      console.error(err);
    }
  }

  async function toggleActive(banner: AdminBanner) {
    try {
      await bannersAdminService.updateBanner(banner.id, { isActive: !banner.isActive });
      toast.success(banner.isActive ? 'Banner desactivado' : 'Banner activado');
      loadBanners();
    } catch (err) {
      toast.error('Error al actualizar banner');
      console.error(err);
    }
  }

  if (loading && banners.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className={sectionStyles.container}>
      <div className={sectionStyles.header}>
        <div>
          <h1 className={sectionStyles.title}>Gestionar Banners</h1>
          <p className={sectionStyles.subtitle}>Crea y organiza los banners de la homepage</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          variant="primary"
        >
          <Plus size={20} />
          Nuevo Banner
        </Button>
      </div>

      {showForm && (
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>{editingId ? 'Editar Banner' : 'Nuevo Banner'}</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Título *</label>
              <input
                id="title"
                type="text"
                placeholder="Título del banner"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                placeholder="Descripción opcional del banner"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="imageUrl">URL de la Imagen *</label>
              <input
                id="imageUrl"
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                required
              />
              {formData.imageUrl && (
                <img src={formData.imageUrl} alt="preview" className={styles.preview} />
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="link">Link del Banner</label>
              <input
                id="link"
                type="url"
                placeholder="https://ejemplo.com (opcional)"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="displayOrder">Orden de Visualización</label>
                <input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Activo
                </label>
              </div>
            </div>

            <div className={styles.formActions}>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                {editingId ? 'Actualizar' : 'Crear'} Banner
              </Button>
            </div>
          </form>
        </div>
      )}

      {banners.length === 0 ? (
        <EmptyState 
          title="No hay banners" 
          description="Crea tu primer banner para mostrar en la homepage"
        />
      ) : (
        <div className={styles.bannersGrid}>
          {banners.map((banner) => (
            <div key={banner.id} className={styles.bannerCard}>
              <div className={styles.bannerImageWrapper}>
                <img src={banner.imageUrl} alt={banner.title} />
                <div className={styles.badgeContainer}>
                  {!banner.isActive && <span className={styles.badge}>Inactivo</span>}
                </div>
              </div>

              <div className={styles.bannerInfo}>
                <h3 className={styles.bannerTitle}>{banner.title}</h3>
                {banner.description && (
                  <p className={styles.bannerDescription}>{banner.description}</p>
                )}
                <div className={styles.bannerMeta}>
                  <span className={styles.order}>Orden: {banner.displayOrder}</span>
                </div>
              </div>

              <div className={styles.bannerActions}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => toggleActive(banner)}
                  title={banner.isActive ? 'Desactivar' : 'Activar'}
                >
                  {banner.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => handleEdit(banner)}
                  title="Editar"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                  onClick={() => handleDelete(banner.id)}
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
