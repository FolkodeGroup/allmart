/**
 * Componente de campo de input reutilizable con validación por campo
 * Muestra errores, sugerencias e indicadores visuales
 */

import React from 'react';
import { AlertCircle, CheckCircle, Loader, Lightbulb } from 'lucide-react';
import styles from './ProductWizard.module.css';
import type { FieldValidationState } from './useFieldValidation';

interface ValidationFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (value: any) => void;
  onBlur?: () => void;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  disabled?: boolean;
  readOnly?: boolean;
  validation?: FieldValidationState;
  showCharCount?: boolean;
  hint?: string;
  autoComplete?: string;
}

export const ValidationField = React.forwardRef<HTMLInputElement, ValidationFieldProps>(
  (
    {
      id,
      label,
      type = 'text',
      placeholder,
      value,
      onChange,
      onBlur,
      required,
      maxLength,
      minLength,
      disabled,
      readOnly,
      validation,
      showCharCount,
      hint,
      autoComplete,
    },
    ref
  ) => {
    const isValid = validation?.isValid === true;
    const isInvalid = validation?.isValid === false;
    const isValidating = validation?.isValidating ?? false;
    const error = validation?.error;

    const inputClass = [
      styles.input,
      isInvalid && styles.inputError,
      isValid && styles.inputSuccess,
      isValidating && styles.inputValidating,
    ]
      .filter(Boolean)
      .join(' ');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = type === 'number' ? parseFloat(e.target.value) : e.target.value;
      onChange(newValue);
    };

    return (
      <div className={styles.formGroup}>
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>

        <div className={styles.inputWrapper}>
          <input
            ref={ref}
            id={id}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onBlur={onBlur}
            className={inputClass}
            maxLength={maxLength}
            minLength={minLength}
            disabled={disabled}
            readOnly={readOnly}
            autoComplete={autoComplete}
          />

          {/* Indicadores de validación */}
          <div className={styles.inputIndicators}>
            {isValidating && <Loader size={18} className={styles.loaderIcon} />}
            {isValid && <CheckCircle size={18} className={styles.successIcon} />}
            {isInvalid && <AlertCircle size={18} className={styles.errorIcon} />}
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <span className={styles.errorMessage}>
            <AlertCircle size={14} />
            {error.message}
          </span>
        )}

        {/* Sugerencia */}
        {error?.suggestion && (
          <div className={styles.suggestionBox}>
            <Lightbulb size={14} />
            <div>
              <strong>Sugerencia:</strong> {error.suggestion}
            </div>
          </div>
        )}

        {/* Hint */}
        {hint && !error && (
          <small className={styles.hint}>{hint}</small>
        )}

        {/* Contador de caracteres */}
        {showCharCount && maxLength && (
          <small className={styles.charCount}>
            {String(value).length}/{maxLength}
          </small>
        )}
      </div>
    );
  }
);

ValidationField.displayName = 'ValidationField';
