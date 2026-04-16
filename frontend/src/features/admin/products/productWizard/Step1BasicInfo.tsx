import React, { useState, forwardRef, useImperativeHandle } from 'react';
import styles from './ProductWizard.module.css';
import type { StepProps } from './types';

export const Step1BasicInfo = forwardRef<{ validate: () => boolean }, StepProps>(
  ({ data, onDataChange, categories }, ref) => {
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

      setValidationErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    useImperativeHandle(ref, () => ({
      validate: validateStep,
    }));

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onDataChange({ ...data, name: value });
      if (validationErrors.name && value.trim()) {
        const newErrors = { ...validationErrors };
        delete newErrors.name;
        setValidationErrors(newErrors);
      }
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      onDataChange({ ...data, categoryId: value });
      if (validationErrors.categoryId && value) {
        const newErrors = { ...validationErrors };
        delete newErrors.categoryId;
        setValidationErrors(newErrors);
      }
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      onDataChange({ ...data, description: value });
      if (validationErrors.description && value.trim()) {
        const newErrors = { ...validationErrors };
        delete newErrors.description;
        setValidationErrors(newErrors);
      }
    };

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Información Básica del Producto</h2>
      <p className={styles.stepDescription}>Completá los datos esenciales de tu producto</p>

      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.label}>
          Nombre del Producto <span className={styles.required}>*</span>
        </label>
        <input
          id="name"
          type="text"
          placeholder="Ej: Zapatillas Running Pro"
          value={data.name || ''}
          onChange={handleNameChange}
          className={`${styles.input} ${validationErrors.name ? styles.inputError : ''}`}
          maxLength={100}
        />
        {validationErrors.name && (
          <span className={styles.errorMessage}>{validationErrors.name}</span>
        )}
        <small className={styles.charCount}>{(data.name || '').length}/100</small>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="categoryId" className={styles.label}>
          Categoría <span className={styles.required}>*</span>
        </label>
        <select
          id="categoryId"
          value={data.categoryId || ''}
          onChange={handleCategoryChange}
          className={`${styles.input} ${validationErrors.categoryId ? styles.inputError : ''}`}
        >
          <option value="">Seleccionar categoría...</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {validationErrors.categoryId && (
          <span className={styles.errorMessage}>{validationErrors.categoryId}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.label}>
          Descripción <span className={styles.required}>*</span>
        </label>
        <textarea
          id="description"
          placeholder="Describe las características principales del producto..."
          value={data.description || ''}
          onChange={handleDescriptionChange}
          className={`${styles.textarea} ${validationErrors.description ? styles.inputError : ''}`}
          rows={5}
          maxLength={500}
        />
        {validationErrors.description && (
          <span className={styles.errorMessage}>{validationErrors.description}</span>
        )}
        <small className={styles.charCount}>{(data.description || '').length}/500</small>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="shortDescription" className={styles.label}>
          Descripción Corta (opcional)
        </label>
        <input
          id="shortDescription"
          type="text"
          placeholder="Resumen en una línea"
          value={data.shortDescription || ''}
          onChange={(e) => onDataChange({ ...data, shortDescription: e.target.value })}
          className={styles.input}
          maxLength={150}
        />
        <small className={styles.charCount}>{(data.shortDescription || '').length}/150</small>
      </div>

      <div className={styles.info}>
        <p>✓ Completá estos campos para continuar al siguiente paso</p>
      </div>
    </div>
  );
}
);
