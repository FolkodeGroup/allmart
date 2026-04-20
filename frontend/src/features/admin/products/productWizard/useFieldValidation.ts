/**
 * Hook para validación por campo en tiempo real
 * Maneja validación onBlur, indicadores visuales y sugerencias
 */

import { useState, useCallback } from 'react';

export interface FieldError {
  message: string;
  suggestion?: string;
}

export interface FieldValidationState {
  error: FieldError | null;
  isValidating: boolean;
  isValid: boolean | null; // null = no validado aún, true = válido, false = inválido
}

export interface FieldValidator {
  (value: any): Promise<FieldError | null>;
}

export function useFieldValidation(validator?: FieldValidator) {
  const [state, setState] = useState<FieldValidationState>({
    error: null,
    isValidating: false,
    isValid: null,
  });

  const validate = useCallback(
    async (value: any) => {
      if (!validator) {
        setState({ error: null, isValidating: false, isValid: true });
        return null;
      }

      setState((prev) => ({ ...prev, isValidating: true }));

      try {
        const error = await validator(value);
        setState({
          error: error || null,
          isValidating: false,
          isValid: error ? false : true,
        });
        return error;
      } catch (err) {
        const error: FieldError = {
          message: 'Error durante la validación',
        };
        setState({ error, isValidating: false, isValid: false });
        return error;
      }
    },
    [validator]
  );

  const clearError = useCallback(() => {
    setState({ error: null, isValidating: false, isValid: null });
  }, []);

  return {
    ...state,
    validate,
    clearError,
  };
}

/**
 * Validadores básicos reutilizables
 */

export const fieldValidators = {
  // Validar nombre no vacío
  name: async (value: string): Promise<FieldError | null> => {
    if (!value || !value.trim()) {
      return { message: 'El nombre es obligatorio' };
    }
    if (value.trim().length < 3) {
      return { message: 'El nombre debe tener al menos 3 caracteres' };
    }
    if (value.trim().length > 100) {
      return { message: 'El nombre no puede exceder 100 caracteres' };
    }
    return null;
  },

  // Validar descripción no vacía
  description: async (value: string): Promise<FieldError | null> => {
    if (!value || !value.trim()) {
      return { message: 'La descripción es obligatoria' };
    }
    if (value.trim().length < 10) {
      return { message: 'La descripción debe tener al menos 10 caracteres' };
    }
    if (value.trim().length > 500) {
      return { message: 'La descripción no puede exceder 500 caracteres' };
    }
    return null;
  },

  // Validar categoría seleccionada
  category: async (value: string): Promise<FieldError | null> => {
    if (!value) {
      return { message: 'Debes seleccionar una categoría' };
    }
    return null;
  },

  // Validar slug único
  slug: async (value: string, checkUniqueness?: () => Promise<boolean>): Promise<FieldError | null> => {
    if (!value || !value.trim()) {
      return { message: 'El slug es obligatorio' };
    }

    // Validar formato de slug
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(value)) {
      return {
        message: 'El slug solo puede contener letras minúsculas, números y guiones',
        suggestion: value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
      };
    }

    // Validar unicidad si se proporciona función de chequeo
    if (checkUniqueness) {
      const isUnique = await checkUniqueness();
      if (!isUnique) {
        return {
          message: 'Este slug ya está en uso',
          suggestion: `${value}-${Date.now()}`,
        };
      }
    }

    return null;
  },

  // Validar SKU único
  sku: async (value: string, checkUniqueness?: () => Promise<boolean>): Promise<FieldError | null> => {
    if (!value || !value.trim()) {
      return { message: 'El SKU es obligatorio' };
    }

    if (value.trim().length > 50) {
      return { message: 'El SKU no puede exceder 50 caracteres' };
    }

    // Validar unicidad si se proporciona función de chequeo
    if (checkUniqueness) {
      const isUnique = await checkUniqueness();
      if (!isUnique) {
        return {
          message: 'Este SKU ya está en uso',
          suggestion: `${value}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        };
      }
    }

    return null;
  },

  // Validar precio > 0
  price: async (value: number): Promise<FieldError | null> => {
    if (value === undefined || value === null) {
      return { message: 'El precio es obligatorio' };
    }
    if (value <= 0) {
      return { message: 'El precio debe ser mayor a 0' };
    }
    if (value > 999999) {
      return { message: 'El precio es demasiado alto' };
    }
    return null;
  },

  // Validar stock >= 0
  stock: async (value: number): Promise<FieldError | null> => {
    if (value === undefined || value === null) {
      return { message: 'El stock es obligatorio' };
    }
    if (value < 0) {
      return { message: 'El stock no puede ser negativo' };
    }
    return null;
  },
};
