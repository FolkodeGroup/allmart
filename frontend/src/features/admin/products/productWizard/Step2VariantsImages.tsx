import React, { useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { X, Plus, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import styles from './ProductWizard.module.css';
import { useFieldValidation, fieldValidators } from './useFieldValidation';
import { checkSkuAvailability } from './validationService';
import type { StepProps, WizardVariant } from './types';

export const Step2VariantsImages = forwardRef<{ validate: () => boolean }, StepProps>(
  ({ data, onDataChange }, ref) => {
    const [newVariant, setNewVariant] = useState({ name: '', price: 0, stock: 0, sku: '' });
    const [showVariantForm, setShowVariantForm] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [variantFormErrors, setVariantFormErrors] = useState<Record<string, string>>({});

    // Validaciones en tiempo real para formulario de variante
    const variantNameValidation = useFieldValidation(
      useCallback(async (value: string) => {
        if (!value || !value.trim()) {
          return { message: 'El nombre de la variante es obligatorio' };
        }
        return null;
      }, [])
    );

    const variantPriceValidation = useFieldValidation(
      useCallback(async (value: number) => await fieldValidators.price(value), [])
    );

    const variantStockValidation = useFieldValidation(
      useCallback(async (value: number) => await fieldValidators.stock(value), [])
    );

    const variantSkuValidation = useFieldValidation(
      useCallback(
        async (value: string) => {
          if (!value || !value.trim()) return null; // SKU es opcional en variantes

          const basicError = await fieldValidators.sku(value);
          if (basicError) return basicError;

          // Validar unicidad contra API
          const isAvailable = await checkSkuAvailability(value);
          if (!isAvailable) {
            return {
              message: 'Este SKU ya está en uso',
              suggestion: `${value}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            };
          }
          return null;
        },
        []
      )
    );

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

    const handleAddVariant = async () => {
      // Validar todos los campos
      const nameError = await variantNameValidation.validate(newVariant.name);
      const priceError = await variantPriceValidation.validate(newVariant.price);
      const stockError = await variantStockValidation.validate(newVariant.stock);
      const skuError = newVariant.sku ? await variantSkuValidation.validate(newVariant.sku) : null;

      if (nameError || priceError || stockError || skuError) {
        const errors: Record<string, string> = {};
        if (nameError) errors.name = nameError.message;
        if (priceError) errors.price = priceError.message;
        if (stockError) errors.stock = stockError.message;
        if (skuError) errors.sku = skuError.message;
        setVariantFormErrors(errors);
        return;
      }

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
      setVariantFormErrors({});

      // Remove variants error if it existed
      const newErrors = { ...validationErrors };
      delete newErrors.variants;
      setValidationErrors(newErrors);
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
                  <label className={styles.label} htmlFor="variant-name">
                    Nombre <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="variant-name"
                      type="text"
                      placeholder="Ej: Rojo - Talle M"
                      value={newVariant.name}
                      onChange={(e) => {
                        setNewVariant({ ...newVariant, name: e.target.value });
                        variantNameValidation.clearError();
                      }}
                      onBlur={() => variantNameValidation.validate(newVariant.name)}
                      className={`${styles.input} ${variantNameValidation.isValid === false ? styles.inputError : ''} ${variantNameValidation.isValid === true ? styles.inputSuccess : ''}`}
                    />
                    <div className={styles.inputIndicators}>
                      {variantNameValidation.isValidating && <Loader size={16} className={styles.loaderIcon} />}
                      {variantNameValidation.isValid && <CheckCircle size={16} className={styles.successIcon} />}
                      {variantNameValidation.isValid === false && <AlertCircle size={16} className={styles.errorIcon} />}
                    </div>
                  </div>
                  {variantFormErrors.name && (
                    <span className={styles.errorMessage}>{variantFormErrors.name}</span>
                  )}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="variant-price">
                    Precio ($) <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="variant-price"
                      type="number"
                      placeholder="0.00"
                      value={newVariant.price || ''}
                      onChange={(e) => {
                        setNewVariant({ ...newVariant, price: parseFloat(e.target.value) || 0 });
                        variantPriceValidation.clearError();
                      }}
                      onBlur={() => variantPriceValidation.validate(newVariant.price)}
                      className={`${styles.input} ${variantPriceValidation.isValid === false ? styles.inputError : ''} ${variantPriceValidation.isValid === true ? styles.inputSuccess : ''}`}
                      min="0"
                      step="0.01"
                    />
                    <div className={styles.inputIndicators}>
                      {variantPriceValidation.isValidating && <Loader size={16} className={styles.loaderIcon} />}
                      {variantPriceValidation.isValid && <CheckCircle size={16} className={styles.successIcon} />}
                      {variantPriceValidation.isValid === false && <AlertCircle size={16} className={styles.errorIcon} />}
                    </div>
                  </div>
                  {variantFormErrors.price && (
                    <span className={styles.errorMessage}>{variantFormErrors.price}</span>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="variant-stock">
                    Stock <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="variant-stock"
                      type="number"
                      placeholder="0"
                      value={newVariant.stock || ''}
                      onChange={(e) => {
                        setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 });
                        variantStockValidation.clearError();
                      }}
                      onBlur={() => variantStockValidation.validate(newVariant.stock)}
                      className={`${styles.input} ${variantStockValidation.isValid === false ? styles.inputError : ''} ${variantStockValidation.isValid === true ? styles.inputSuccess : ''}`}
                      min="0"
                    />
                    <div className={styles.inputIndicators}>
                      {variantStockValidation.isValidating && <Loader size={16} className={styles.loaderIcon} />}
                      {variantStockValidation.isValid && <CheckCircle size={16} className={styles.successIcon} />}
                      {variantStockValidation.isValid === false && <AlertCircle size={16} className={styles.errorIcon} />}
                    </div>
                  </div>
                  {variantFormErrors.stock && (
                    <span className={styles.errorMessage}>{variantFormErrors.stock}</span>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="variant-sku">SKU (opcional)</label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="variant-sku"
                      type="text"
                      placeholder="SKU único"
                      value={newVariant.sku}
                      onChange={(e) => {
                        setNewVariant({ ...newVariant, sku: e.target.value });
                        variantSkuValidation.clearError();
                      }}
                      onBlur={() => newVariant.sku && variantSkuValidation.validate(newVariant.sku)}
                      className={`${styles.input} ${variantSkuValidation.isValid === false ? styles.inputError : ''} ${variantSkuValidation.isValid === true ? styles.inputSuccess : ''}`}
                    />
                    <div className={styles.inputIndicators}>
                      {variantSkuValidation.isValidating && <Loader size={16} className={styles.loaderIcon} />}
                      {variantSkuValidation.isValid && <CheckCircle size={16} className={styles.successIcon} />}
                      {variantSkuValidation.isValid === false && <AlertCircle size={16} className={styles.errorIcon} />}
                    </div>
                  </div>
                  {variantFormErrors.sku && (
                    <span className={styles.errorMessage}>{variantFormErrors.sku}</span>
                  )}
                  {variantSkuValidation.error?.suggestion && (
                    <div className={styles.suggestionBox}>
                      <span>Sugerencia: {variantSkuValidation.error.suggestion}</span>
                    </div>
                  )}
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
                  onClick={() => {
                    setShowVariantForm(false);
                    setVariantFormErrors({});
                  }}
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
