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
  imageFile: File | null;
  displayOrder: number;
  isActive: boolean;
  altText: string;
}

export function BannersAdmin() {
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    imageFile: null,
    displayOrder: 0,
    isActive: true,
    altText: '',
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
      imageFile: null,
      displayOrder: 0,
      isActive: true,
      altText: '',
    });
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(banner: AdminBanner) {
    setFormData({
      title: banner.title,
      description: banner.description || '',
      imageFile: null, // No cargar archivo, solo metadatos
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
      altText: banner.altText || '',
    });
    setEditingId(banner.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Título es requerido');
      return;
    }

    // Para crear, requiere imagen
    if (!editingId && !formData.imageFile) {
      toast.error('Imagen es requerida para crear un nuevo banner');
      return;
    }

    try {
      if (editingId) {
        // Actualizar metadatos
        await bannersAdminService.updateBanner(editingId, {
          title: formData.title,
          description: formData.description,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
          altText: formData.altText,
        });

        // Si hay imagen nueva, actualizar
        if (formData.imageFile) {
          await bannersAdminService.updateBannerImage(editingId, formData.imageFile);
        }
        toast.success('Banner actualizado');
      } else {
        // Crear nuevo
        await bannersAdminService.createBanner(
          {
            title: formData.title,
            description: formData.description,
            displayOrder: formData.displayOrder,
            isActive: formData.isActive,
            altText: formData.altText,
          },
          formData.imageFile!
        );
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
              <label htmlFor="image">Imagen del Banner {!editingId && '*'}</label>
              <input
                id="image"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff"
                onChange={(e) => setFormData({ ...formData, imageFile: e.target.files?.[0] ?? null })}
                required={!editingId}
              />
              {formData.imageFile && (
                <img 
                  src={URL.createObjectURL(formData.imageFile)} 
                  alt="preview" 
                  className={styles.preview} 
                />
              )}
              {editingId && !formData.imageFile && (
                <div className={styles.currentImageInfo}>
                  <p>Imagen actual cargada</p>
                  <img 
                    src={banners.find(b => b.id === editingId)?.thumbUrl}
                    alt="current"
                    className={styles.preview}
                  />
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="altText">Texto Alternativo de Imagen</label>
              <input
                id="altText"
                type="text"
                placeholder="Descripción para accesibilidad"
                value={formData.altText}
                onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="displayOrder">Orden de Visualización</label>
                <input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setFormData({ ...formData, displayOrder: Number.isNaN(parsed) ? 0 : parsed });
                  }}
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
