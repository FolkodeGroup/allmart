import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import styles from './ProductWizard.module.css';
import type { StepProps } from './types';

export const Step1BasicInfo = React.memo(forwardRef<{ validate: () => boolean }, StepProps>(
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


    // Estado local para descripción
    const [localDescription, setLocalDescription] = useState(data.description || '');

    // Sincroniza el estado local si cambia el prop externo (ej: draft)
    useEffect(() => {
      setLocalDescription(data.description || '');
    }, [data.description]);

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setLocalDescription(value);
      if (validationErrors.description && value.trim()) {
        const newErrors = { ...validationErrors };
        delete newErrors.description;
        setValidationErrors(newErrors);
      }
    };

    const handleDescriptionBlur = () => {
      if (localDescription !== data.description) {
        onDataChange({ ...data, description: localDescription });
      }
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

    // Referencias para inputs
    const nameInputRef = useRef<HTMLInputElement>(null);
    const shortDescInputRef = useRef<HTMLInputElement>(null);

    // Evita que el input de descripción corta autoenfoque el de nombre
    // (no se agrega ningún handler que cambie el focus)

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
            ref={nameInputRef}
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
            value={localDescription}
            onChange={handleDescriptionChange}
            onBlur={handleDescriptionBlur}
            className={`${styles.textarea} ${validationErrors.description ? styles.inputError : ''}`}
            rows={5}
            maxLength={500}
          />
          {validationErrors.description && (
            <span className={styles.errorMessage}>{validationErrors.description}</span>
          )}
          <small className={styles.charCount}>{(localDescription || '').length}/500</small>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="shortDescription" className={styles.label}>
            Descripción Corta (opcional)
          </label>
          <input
            id="shortDescription"
            ref={shortDescInputRef}
            type="text"
            placeholder="Resumen en una línea"
            value={localShortDescription}
            onChange={handleShortDescriptionChange}
            onBlur={handleShortDescriptionBlur}
            className={styles.input}
            maxLength={150}
          />
          <small className={styles.charCount}>{(localShortDescription || '').length}/150</small>
        </div>

        <div className={styles.info}>
          <p>✓ Completá estos campos para continuar al siguiente paso</p>
        </div>
      </div>
    );
  }
));
