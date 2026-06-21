/**
 * features/admin/banners/BannersAdmin.tsx
 * Página de administración de banners de la homepage
 */

import { useState, useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useUnsavedChangesWarning } from '../../../hooks/useUnsavedChangesWarning';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { Trash2, Plus, Edit2, Eye, EyeOff } from 'lucide-react';
import { bannersAdminService, type AdminBanner } from './bannersAdminService';
import { publicBannersService } from '../../../services/publicBannersService';
import { Button } from '../../../components/ui/Button/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import styles from './BannersAdmin.module.css';
import sectionStyles from '../shared/AdminSection.module.css';
import { BannerFilterBuilder } from './BannerFilterBuilder';
import type { BannerFilterConfig } from '../../../types/bannerFilter';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';

type FieldErrors = {
  title?: string;
  imageFile?: string;
};

interface FormData {
  title: string;
  imageFile: File | null;
  isPinned: boolean;
  isActive: boolean;
  altText: string;
  filterConfig: BannerFilterConfig;
}

function appendCacheBusting(url: string, updatedAt?: string): string {
  if (!url) return url;
  const timestamp = updatedAt ? String(new Date(updatedAt).getTime()) : String(Date.now());
  return url.includes('?') ? `${url}&v=${timestamp}` : `${url}?v=${timestamp}`;
}

export function BannersAdmin() {
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const { categories } = useAdminCategories();
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAltManuallyEdited, setIsAltManuallyEdited] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<AdminBanner | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    imageFile: null,
    isPinned: false,
    isActive: true,
    altText: '',
    filterConfig: {},
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Unsaved changes detection
  const initialFormDataRef = useRef<{ title: string; isPinned: boolean; isActive: boolean; altText: string; filterConfig: BannerFilterConfig; }>({
    title: '',
    isPinned: false,
    isActive: true,
    altText: '',
    filterConfig: {},
  });

  const isDirty = showForm && (
    formData.title !== initialFormDataRef.current.title ||
    formData.isPinned !== initialFormDataRef.current.isPinned ||
    formData.isActive !== initialFormDataRef.current.isActive ||
    formData.altText !== initialFormDataRef.current.altText ||
    formData.filterConfig !== initialFormDataRef.current.filterConfig ||
    formData.imageFile !== null
  );

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

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const blocker = useBlocker(isDirty);

  function handleCancelForm() {
    interceptNavigation(() => {
      resetForm();
    });
  }

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    try {
      setLoading(true);
      const data = await bannersAdminService.getAllBanners();
      setBanners(data);
    } catch (err) {
      toast.error('Error al cargar banners');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setFormData({
      title: '',
      imageFile: null,
      isPinned: false,
      isActive: true,
      altText: '',
      filterConfig: {},
    });
    setEditingId(null);
    setShowForm(false);
    setIsAltManuallyEdited(false);
  }

  function handleEdit(banner: AdminBanner) {
    initialFormDataRef.current = {
      title: banner.title,
      isPinned: banner.isPinned,
      isActive: banner.isActive,
      altText: banner.altText || '',
      filterConfig: banner.filterConfig || {},
    };
    setFormData({
      title: banner.title,
      imageFile: null,
      isPinned: banner.isPinned,
      isActive: banner.isActive,
      altText: banner.altText || '',
      filterConfig: banner.filterConfig || {},
    });
    setEditingId(banner.id);
    setShowForm(true);
    setIsAltManuallyEdited(
      !!banner.altText && banner.altText !== banner.title
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        await bannersAdminService.updateBanner(editingId, {
          title: formData.title,
          isPinned: formData.isPinned,
          isActive: formData.isActive,
          altText: formData.altText,
          filterConfig: formData.filterConfig,
        });
        if (formData.imageFile) {
          await bannersAdminService.updateBannerImage(editingId, formData.imageFile);
        }
        toast.success('Banner actualizado');
      } else {
        await bannersAdminService.createBanner(
          {
            title: formData.title,
            filterConfig: formData.filterConfig,
            isPinned: formData.isPinned,
            isActive: formData.isActive,
            altText: formData.altText,
          },
          formData.imageFile!
        );
        toast.success('Banner creado');
      }
      publicBannersService.invalidateCache();
      resetForm();
      await loadBanners();
    } catch (err) {
      toast.error(editingId ? 'Error al actualizar banner' : 'Error al crear banner');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      altText: isAltManuallyEdited ? prev.altText : title,
    }));
    if (fieldErrors.title) {
      setFieldErrors((prev) => ({ ...prev, title: undefined }));
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }

    setFormData({ ...formData, imageFile: file });
    if (fieldErrors.imageFile) {
      setFieldErrors((prev) => ({ ...prev, imageFile: undefined }));
    }
  }

  async function handleDeleteConfirm() {
    if (!bannerToDelete) return;

    setIsDeleting(true);

    try {
      await bannersAdminService.deleteBanner(bannerToDelete.id);
      publicBannersService.invalidateCache();
      toast.success('Banner eliminado');
      setDeleteModalOpen(false);
      setBannerToDelete(null);
      await loadBanners();
    } catch (err) {
      toast.error('Error al eliminar banner');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  }

  function openDeleteModal(banner: AdminBanner) {
    setBannerToDelete(banner);
    setDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    setDeleteModalOpen(false);
    setBannerToDelete(null);
  }

  async function toggleActive(banner: AdminBanner) {
    try {
      await bannersAdminService.updateBanner(banner.id, { isActive: !banner.isActive });
      publicBannersService.invalidateCache();
      toast.success(banner.isActive ? 'Banner desactivado' : 'Banner activado');
      await loadBanners();
    } catch (err) {
      toast.error('Error al actualizar banner');
      console.error(err);
    }
  }

  function validateForm(): FieldErrors {
    const errors: FieldErrors = {};

    if (!formData.title.trim()) {
      errors.title = 'El título es obligatorio';
    }

    if (!editingId && !formData.imageFile) {
      errors.imageFile = 'La imagen es obligatoria';
    }

    return errors;
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
            initialFormDataRef.current = {
              title: '',
              isPinned: false,
              isActive: true,
              altText: '',
              filterConfig: {},
            };
            setFormData((prev) => ({ ...prev, isPinned: false }));
            setShowForm(true);
          }}
        >
          <Plus size={16} />
          Nuevo Banner
        </Button>
      </div>

      {showForm && (
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>{editingId ? 'Editar Banner' : 'Nuevo Banner'}</h2>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.formGroup}>
              <label htmlFor="banner-title">Título *</label>
              <input
                id="banner-title"
                name="bannerTitle"
                type="text"
                placeholder="Título del banner"
                value={formData.title}
                onChange={handleTitleChange}
                className={`${fieldErrors.title ? styles.inputError : ''}`}
                aria-invalid={!!fieldErrors.title}
                aria-describedby={fieldErrors.title ? 'title-error' : undefined}
              />
              {fieldErrors.title && (
                <span id="title-error" className={styles.errorMsg} role="alert">
                  {fieldErrors.title}
                </span>
              )}
            </div>

            <div>
              <fieldset className={styles.formGroup} style={{ border: "none" }}>
                <legend className={styles.legend}>Destino del banner</legend>
                <BannerFilterBuilder
                  value={formData.filterConfig}
                  onChange={filterConfig => setFormData(prev => ({ ...prev, filterConfig }))}
                  categories={categories}
                />
              </fieldset>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="banner-image">Imagen del Banner {!editingId && '*'}</label>
              <input
                id="banner-image"
                name="bannerImage"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff"
                onChange={handleImageChange}
                className={`${fieldErrors.imageFile ? styles.inputError : ''}`}
                aria-invalid={!!fieldErrors.imageFile}
                aria-describedby={fieldErrors.imageFile ? 'image-error' : undefined}
              />

              {fieldErrors.imageFile && (
                <span id="image-error" className={styles.errorMsg} role="alert">
                  {fieldErrors.imageFile}
                </span>
              )}
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="preview"
                  className={styles.preview}
                />
              )}
              {!previewUrl && editingId && !formData.imageFile && (
                <div className={styles.currentImageInfo}>
                  <p>Imagen actual cargada</p>
                  <img
                    src={appendCacheBusting(
                      banners.find((b) => b.id === editingId)?.thumbUrl ?? '',
                      banners.find((b) => b.id === editingId)?.updatedAt
                    )}
                    alt="current"
                    className={styles.preview}
                  />
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="banner-alt-text">Texto Alternativo de Imagen</label>
              <input
                id="banner-alt-text"
                name="bannerAltText"
                type="text"
                placeholder="Descripción para accesibilidad"
                value={formData.altText}
                onChange={(e) => {
                  setIsAltManuallyEdited(true);
                  setFormData({ ...formData, altText: e.target.value });
                }}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel} htmlFor="banner-is-pinned">
                  <input
                    id="banner-is-pinned"
                    name="bannerIsPinned"
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  />
                  Fijar al inicio 📌
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel} htmlFor="banner-is-active">
                  <input
                    id="banner-is-active"
                    name="bannerIsActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Activo
                </label>
              </div>
            </div>

            <div className={styles.formActions}>
              <Button type="button" className={styles.btnSecondary} onClick={handleCancelForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className={styles.btnPrimary}
                isLoading={isSubmitting}
                loadingText={editingId ? 'Actualizando...' : 'Creando...'}
              >
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
                <img src={appendCacheBusting(banner.imageUrl, banner.updatedAt)} alt={banner.title} />
                <div className={styles.badgeContainer}>
                  {!banner.isActive && <span className={styles.badge}>Inactivo</span>}
                </div>
              </div>

              <div className={styles.bannerInfo}>
                <h3 className={styles.bannerTitle}>{banner.title}</h3>
                <div className={styles.bannerMeta}>
                  {banner.isPinned && <span className={styles.badgePinned}>📌 Fijado</span>}
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
                  onClick={() => openDeleteModal(banner)}
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unsaved changes warning */}
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

      <ModalConfirm
        open={deleteModalOpen}
        title="Eliminar Banner"
        message={
          bannerToDelete
            ? `¿Estás seguro de que deseas eliminar el banner "${bannerToDelete.title}"? Esta acción no se puede deshacer.`
            : '¿Estás seguro de que deseas eliminar este banner?'
        }
        confirmText={isDeleting ? 'Eliminando...' : 'Eliminar'}
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={closeDeleteModal}
      />
    </div>
  );
}