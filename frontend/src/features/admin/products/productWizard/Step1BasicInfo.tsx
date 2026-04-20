import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import styles from './ProductWizard.module.css';
import { useFieldValidation, fieldValidators } from './useFieldValidation';
import { checkSkuAvailability } from './validationService';
import { ValidationField } from './ValidationField';
import type { StepProps } from './types';

export const Step1BasicInfo = React.memo(forwardRef<{ validate: () => boolean }, StepProps>(
  ({ data, onDataChange, categories }, ref) => {
    // Validaciones por campo con hooks
    const nameValidation = useFieldValidation(
      useCallback(async (value: string) => await fieldValidators.name(value), [])
    );

    const descriptionValidation = useFieldValidation(
      useCallback(async (value: string) => await fieldValidators.description(value), [])
    );

    const categoryValidation = useFieldValidation(
      useCallback(async (value: string) => await fieldValidators.category(value), [])
    );

    const skuValidation = useFieldValidation(
      useCallback(
        async (value: string) => {
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

      if (!data.name?.trim()) {
        newErrors.name = 'El nombre es obligatorio';
      }
      if (!data.categoryId) {
        newErrors.categoryId = 'Debes seleccionar una categoría';
      }
      if (!data.description?.trim()) {
        newErrors.description = 'La descripción es obligatoria';
      }

      return Object.keys(newErrors).length === 0;
    };

    useImperativeHandle(ref, () => ({
      validate: validateStep,
    }));

    const handleNameChange = (value: string) => {
      onDataChange({ ...data, name: value });
      nameValidation.clearError();
    };

    const handleNameBlur = async () => {
      await nameValidation.validate(data.name || '');
    };

    const handleCategoryChange = (value: string) => {
      onDataChange({ ...data, categoryId: value });
      categoryValidation.clearError();
    };

    const handleCategoryBlur = async () => {
      await categoryValidation.validate(data.categoryId || '');
    };

    const handleSkuChange = (value: string) => {
      onDataChange({ ...data, sku: value });
      skuValidation.clearError();
    };

    const handleSkuBlur = async () => {
      await skuValidation.validate(data.sku || '');
    };


    // Estado local para descripción
    const [localDescription, setLocalDescription] = useState(data.description || '');

    // Sincroniza el estado local si cambia el prop externo (ej: draft)
    useEffect(() => {
      setLocalDescription(data.description || '');
    }, [data.description]);

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setLocalDescription(value);
      descriptionValidation.clearError();
    };

    const handleDescriptionBlur = async () => {
      if (localDescription !== data.description) {
        onDataChange({ ...data, description: localDescription });
      }
      await descriptionValidation.validate(localDescription);
    };

    // Estado local para shortDescription
    const [localShortDescription, setLocalShortDescription] = useState(data.shortDescription || '');

    useEffect(() => {
      setLocalShortDescription(data.shortDescription || '');
    }, [data.shortDescription]);

    const handleShortDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalShortDescription(e.target.value);
    };

    const handleShortDescriptionBlur = () => {
      if (localShortDescription !== data.shortDescription) {
        onDataChange({ ...data, shortDescription: localShortDescription });
      }
    };

    // ...existing code...

    return (
      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>Información Básica del Producto</h2>
        <p className={styles.stepDescription}>Completá los datos esenciales de tu producto</p>

        <div className={styles.formGroup}>
          <ValidationField
            id="name"
            label="Nombre del Producto"
            placeholder="Ej: Zapatillas Running Pro"
            value={data.name || ''}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            required
            maxLength={100}
            validation={nameValidation}
            showCharCount
            hint="Nombre descriptivo del producto (3-100 caracteres)"
            autoComplete="off"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="categoryId" className={styles.label}>
            Categoría <span className={styles.required}>*</span>
          </label>
          <select
            id="categoryId"
            value={data.categoryId || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            onBlur={handleCategoryBlur}
            className={`${styles.input} ${categoryValidation.isValid === false ? styles.inputError : ''} ${categoryValidation.isValid === true ? styles.inputSuccess : ''}`}
          >
            <option value="">Seleccionar categoría...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {categoryValidation.error && (
            <span className={styles.errorMessage}>{categoryValidation.error.message}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>
            Descripción <span className={styles.required}>*</span>
          </label>
          <textarea
            id="description"
            placeholder="Describe las características principales del producto..."
            value={localDescription}
            onChange={handleDescriptionChange}
            onBlur={handleDescriptionBlur}
            className={`${styles.textarea} ${descriptionValidation.isValid === false ? styles.inputError : ''} ${descriptionValidation.isValid === true ? styles.inputSuccess : ''}`}
            rows={5}
            maxLength={500}
          />
          {descriptionValidation.error && (
            <span className={styles.errorMessage}>{descriptionValidation.error.message}</span>
          )}
          <small className={styles.charCount}>{(localDescription || '').length}/500</small>
        </div>

        <div className={styles.formGroup}>
          <ValidationField
            id="sku"
            label="SKU (Código Único)"
            placeholder="Ej: ZAPA-RUN-001"
            value={data.sku || ''}
            onChange={handleSkuChange}
            onBlur={handleSkuBlur}
            maxLength={50}
            validation={skuValidation}
            hint="Código único para este producto en el inventario"
            autoComplete="off"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="shortDescription" className={styles.label}>
            Descripción Corta (opcional)
          </label>
          <input
            id="shortDescription"
            type="text"
            placeholder="Resumen en una línea"
            value={localShortDescription}
            onChange={handleShortDescriptionChange}
            onBlur={handleShortDescriptionBlur}
            className={styles.input}
            maxLength={150}
            autoComplete="off"
          />
          <small className={styles.charCount}>{(localShortDescription || '').length}/150</small>
        </div>

        <div className={styles.info}>
          <p>✓ La validación en tiempo real te mostrará errores al salir de cada campo</p>
        </div>
      </div>
    );
  }
));
