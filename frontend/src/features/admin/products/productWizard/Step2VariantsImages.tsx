import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { X, Plus } from 'lucide-react';
import styles from './ProductWizard.module.css';
import type { StepProps, WizardVariant } from './types';

export const Step2VariantsImages = forwardRef<{ validate: () => boolean }, StepProps>(
  ({ data, onDataChange }, ref) => {
    const [newVariant, setNewVariant] = useState({ name: '', price: 0, stock: 0, sku: '' });
    const [showVariantForm, setShowVariantForm] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const validateStep = (): boolean => {
      const newErrors: Record<string, string> = {};

      if (!data.variants || data.variants.length === 0) {
        newErrors.variants = 'Debes agregar al menos una variante';
      }

      if (!data.images || data.images.length === 0) {
        newErrors.images = 'Debes cargar al menos una imagen';
      } else {
        const validImages = data.images.filter((img) => img && img.trim());
        if (validImages.length === 0) {
          newErrors.images = 'Debes cargar al menos una imagen válida';
        }
      }

      setValidationErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    useImperativeHandle(ref, () => ({
      validate: validateStep,
    }));

    const handleAddVariant = () => {
      if (newVariant.name.trim() && newVariant.price > 0 && newVariant.stock >= 0) {
        const variant: WizardVariant = {
          id: `variant_${Date.now()}`,
          name: newVariant.name,
          price: newVariant.price,
          stock: newVariant.stock,
          sku: newVariant.sku || undefined,
        };

        const updatedVariants = [...(data.variants || []), variant];
        onDataChange({ ...data, variants: updatedVariants });

        setNewVariant({ name: '', price: 0, stock: 0, sku: '' });
        setShowVariantForm(false);

        // Remove variants error if it existed
        const newErrors = { ...validationErrors };
        delete newErrors.variants;
        setValidationErrors(newErrors);
      }
    };

    const handleRemoveVariant = (id: string | undefined) => {
      if (id) {
        const updatedVariants = (data.variants || []).filter((v) => v.id !== id);
        onDataChange({ ...data, variants: updatedVariants });
      }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files;
      if (files) {
        const newImages: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
              newImages.push(result);
              if (newImages.length === files.length) {
                const allImages = [...(data.images || []).filter(img => img), ...newImages];
                onDataChange({ ...data, images: allImages });

                // Remove images error if it existed
                const newErrors = { ...validationErrors };
                delete newErrors.images;
                setValidationErrors(newErrors);
              }
            }
          };
          reader.readAsDataURL(files[i]);
        }
      }
    };

    const handleRemoveImage = (index: number) => {
      const updatedImages = (data.images || []).filter((_, i) => i !== index);
      onDataChange({ ...data, images: updatedImages });
    };

    return (
      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>Variantes e Imágenes</h2>
        <p className={styles.stepDescription}>Agrega variantes del producto e imágenes</p>

        {/* Variantes Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Variantes <span className={styles.required}>*</span>
          </h3>

          {validationErrors.variants && (
            <div className={styles.errorBox}>{validationErrors.variants}</div>
          )}

          {/* Variants List */}
          {data.variants && data.variants.length > 0 && (
            <div className={styles.variantsList}>
              {data.variants.map((variant) => (
                <div key={variant.id} className={styles.variantCard}>
                  <div className={styles.variantInfo}>
                    <strong>{variant.name}</strong>
                    <span className={styles.variantMeta}>
                      ${variant.price} | Stock: {variant.stock}
                      {variant.sku && ` | SKU: ${variant.sku}`}
                    </span>
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => handleRemoveVariant(variant.id)}
                    aria-label="Eliminar variante"
                    type="button"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Variant Form */}
          {!showVariantForm && (
            <button
              className={styles.addBtn}
              onClick={() => setShowVariantForm(true)}
              type="button"
            >
              <Plus size={16} /> Agregar Variante
            </button>
          )}

          {showVariantForm && (
            <div className={styles.formCard}>
              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label} htmlFor="variant-name">Nombre</label>
                  <input
                    id="variant-name"
                    type="text"
                    placeholder="Ej: Rojo - Talle M"
                    value={newVariant.name}
                    onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="variant-price">Precio ($)</label>
                  <input
                    id="variant-price"
                    type="number"
                    placeholder="0"
                    value={newVariant.price || ''}
                    onChange={(e) => setNewVariant({ ...newVariant, price: parseFloat(e.target.value) || 0 })}
                    className={styles.input}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="variant-stock">Stock</label>
                  <input
                    id="variant-stock"
                    type="number"
                    placeholder="0"
                    value={newVariant.stock || ''}
                    onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })}
                    className={styles.input}
                    min="0"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="variant-sku">SKU (opcional)</label>
                  <input
                    id="variant-sku"
                    type="text"
                    placeholder="SKU"
                    value={newVariant.sku}
                    onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  className={styles.btnPrimary}
                  onClick={handleAddVariant}
                  type="button"
                >
                  Agregar
                </button>
                <button
                  className={styles.btnSecondary}
                  onClick={() => setShowVariantForm(false)}
                  type="button"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Images Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Imágenes <span className={styles.required}>*</span>
          </h3>

          {validationErrors.images && (
            <div className={styles.errorBox}>{validationErrors.images}</div>
          )}

          {/* Images Preview */}
          {data.images && data.images.length > 0 && (
            <div className={styles.imagesGrid}>
              {data.images.map((image, index) => (
                image && (
                  <div key={index} className={styles.imageCard}>
                    <img src={image} alt={`Producto ${index + 1}`} className={styles.imagePreview} />
                    <button
                      className={styles.removeImageBtn}
                      onClick={() => handleRemoveImage(index)}
                      aria-label="Eliminar imagen"
                      type="button"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Upload Area */}
          <div className={styles.uploadArea}>
            <label className={styles.uploadLabel} htmlFor="wizard-upload-input">
              <span className="sr-only">Seleccionar imágenes para el producto</span>
              <input
                id="wizard-upload-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className={styles.fileInput}
              />
              <div className={styles.uploadContent}>
                <p className={styles.uploadText}>Arrastra imágenes aquí o haz clic para seleccionar</p>
                <small>JPG, PNG - máx 5MB por imagen</small>
              </div>
            </label>
          </div>
        </div>

        <div className={styles.info}>
          <p>✓ Agrega al menos una variante y una imagen para continuar</p>
        </div>
      </div>
    );
  }
);
