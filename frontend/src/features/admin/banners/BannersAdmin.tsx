type FieldErrors = {
  title?: string;
  imageFile?: string;
  displayOrder?: string;
};
/**
 * features/admin/banners/BannersAdmin.tsx
 * Página de administración de banners de la homepage
 */

import React, { useState, useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useUnsavedChangesWarning } from '../../../hooks/useUnsavedChangesWarning';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { Trash2, Plus, Edit2, Eye, EyeOff } from 'lucide-react';
import { bannersAdminService, type AdminBanner } from './bannersAdminService';
import { Button } from '../../../components/ui/Button/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import styles from './BannersAdmin.module.css';
import sectionStyles from '../shared/AdminSection.module.css';
import { BannerFilterBuilder } from './BannerFilterBuilder';
import type { BannerFilterConfig } from '../../../types/bannerFilter';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';

interface FormData {
  title: string;
  imageFile: File | null;
  displayOrder: number;
  isActive: boolean;
  altText: string;
  filterConfig: BannerFilterConfig;
}

export function BannersAdmin() {
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const { categories } = useAdminCategories();
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAltManuallyEdited, setIsAltManuallyEdited] = useState(false);
  const [displayOrderInput, setDisplayOrderInput] = useState('0');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    imageFile: null,
    displayOrder: 0,
    isActive: true,
    altText: '',
    filterConfig: {},
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Unsaved changes detection
  const initialFormDataRef = useRef<{ title: string; description: string; displayOrder: number; isActive: boolean; altText: string; filterConfig: BannerFilterConfig; }>({
    title: '',
    description: '',
    displayOrder: 0,
    isActive: true,
    altText: '',
    filterConfig: {},
  });

  const isDirty = showForm && (
    formData.title !== initialFormDataRef.current.title ||
    formData.displayOrder !== initialFormDataRef.current.displayOrder ||
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

  const blocker = useBlocker(isDirty);

  function handleCancelForm() {
    interceptNavigation(() => {
      setFormData({ title: '', imageFile: null, displayOrder: 0, isActive: true, altText: '', filterConfig: {} });
      setEditingId(null);
      setShowForm(false);
    });
  }

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
      imageFile: null,
      displayOrder: 0,
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
      description: banner.description || '',
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
      altText: banner.altText || '',
      filterConfig: banner.filterConfig || {},
    };
    setFormData({
      title: banner.title,
      imageFile: null,
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
      altText: banner.altText || '',
      filterConfig: banner.filterConfig || {},
    });
    setEditingId(banner.id);
    setShowForm(true);
    setDisplayOrderInput(String(banner.displayOrder));
    // Si el alt existente difiere del título, el usuario lo editó manualmente en algún momento
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

    try {
      if (editingId) {
        await bannersAdminService.updateBanner(editingId, {
          title: formData.title,
          displayOrder: formData.displayOrder,
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
    setFormData({ ...formData, imageFile: e.target.files?.[0] ?? null });
    if (fieldErrors.imageFile) {
      setFieldErrors((prev) => ({ ...prev, imageFile: undefined }));
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

  // ─── Helper: calcula el siguiente displayOrder disponible ────────────────
  function getNextAvailableOrder(banners: AdminBanner[]): number {
    const used = new Set(banners.map((b) => b.displayOrder));
    let next = 0;
    while (used.has(next)) next++;
    return next;
  }

  // ─── Helper: posiciones libres para el select de edición ─────────────────

  function getAvailableOrders(banners: AdminBanner[], editingId: string | null): number[] {
    const usedByOthers = new Set(
      banners
        .filter((b) => b.id !== editingId)
        .map((b) => b.displayOrder)
    );
    const max = Math.max(...banners.map((b) => b.displayOrder), -1);
    // Mostramos hasta max + 10 posiciones libres adelante
    const EXTRA_SLOTS = 10;
    const upperBound = max + EXTRA_SLOTS;
    return Array.from({ length: upperBound + 1 }, (_, i) => i).filter(
      (n) => !usedByOthers.has(n)
    );
  }

  function validateForm(): FieldErrors {
    const errors: FieldErrors = {};

    if (!formData.title.trim()) {
      errors.title = 'El título es obligatorio';
    }

    if (!editingId && !formData.imageFile) {
      errors.imageFile = 'La imagen es obligatoria';
    }

    const occupied = banners
      .filter((b) => b.id !== editingId)
      .some((b) => b.displayOrder === formData.displayOrder);

    if (occupied) {
      const available = getAvailableOrders(banners, editingId).slice(0, 5);
      errors.displayOrder = `Posición ocupada. Disponibles: ${available.join(', ')}`;
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
            const nextOrder = getNextAvailableOrder(banners);   // ← aquí
            const firstFree = getAvailableOrders(banners, null)[0] ?? 0;
            setDisplayOrderInput(String(firstFree));
            resetForm();
            initialFormDataRef.current = {
              title: '',
              description: '',
              displayOrder: nextOrder,
              isActive: true,
              altText: '',
              filterConfig: {},
            };
            setFormData((prev) => ({ ...prev, displayOrder: nextOrder }));
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
              <label htmlFor="title">Título *</label>
              <input
                id="title"
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

            <div >
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
              <label htmlFor="image">Imagen del Banner {!editingId && '*'}</label>
              <input
                id="image"
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
                onChange={(e) => {
                  setIsAltManuallyEdited(true); // ← el usuario tomó control
                  setFormData({ ...formData, altText: e.target.value });
                }}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="displayOrder">Orden de Visualización</label>
                <input
                  id="displayOrder"
                  type="number"
                  min="0"
                  value={displayOrderInput}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setDisplayOrderInput(raw); // permite vacío mientras escribe

                    const order = parseInt(raw, 10);
                    if (!Number.isNaN(order) && order >= 0) {
                      setFormData((prev) => ({ ...prev, displayOrder: order }));

                      const occupied = banners
                        .filter((b) => b.id !== editingId)
                        .some((b) => b.displayOrder === order);

                      if (occupied) {
                        const available = getAvailableOrders(banners, editingId).slice(0, 5);
                        setFieldErrors((prev) => ({
                          ...prev,
                          displayOrder: `Posición ocupada. Disponibles: ${available.join(', ')}`,
                        }));
                      } else {
                        setFieldErrors((prev) => ({ ...prev, displayOrder: undefined }));
                      }
                    } else {
                      // Campo vacío o inválido: limpiar error, no actualizar formData todavía
                      setFieldErrors((prev) => ({ ...prev, displayOrder: undefined }));
                    }
                  }}
                  onBlur={() => {
                    const order = parseInt(displayOrderInput, 10);
                    if (Number.isNaN(order) || order < 0) {
                      setDisplayOrderInput(String(formData.displayOrder));
                    } else {
                      // ← forzar sincronización aunque el onChange ya lo haya hecho
                      setFormData((prev) => ({ ...prev, displayOrder: order }));
                    }
                  }}
                  className={fieldErrors.displayOrder ? styles.inputError : ''}
                  aria-invalid={!!fieldErrors.displayOrder}
                  aria-describedby={fieldErrors.displayOrder ? 'order-error' : undefined}
                />
                {fieldErrors.displayOrder && (
                  <span id="order-error" className={styles.errorMsg} role="alert">
                    {fieldErrors.displayOrder}
                  </span>
                )}
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
              <Button type="button" className={styles.btnSecondary} onClick={handleCancelForm}>
                Cancelar
              </Button>
              <Button type="submit" className={styles.btnPrimary}>
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
    </div>
  );
}
