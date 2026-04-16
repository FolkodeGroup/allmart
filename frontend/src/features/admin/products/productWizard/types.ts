/**
 * Tipos para el wizard de creación de productos
 */

export interface WizardProduct {
  // Paso 1: Datos básicos
  name: string;
  description: string;
  categoryId: string;

  // Paso 2: Variantes e imágenes
  variants: WizardVariant[];
  images: string[];

  // Paso 3: Configuración final
  price: number;
  stock: number;
  inStock: boolean;
  sku?: string;
  shortDescription?: string;
  tags?: string[];

  // Meta
  id?: string; // Para edición
  createdAt?: string;
}

export interface WizardVariant {
  id?: string;
  name: string;
  price: number;
  stock: number;
  sku?: string;
}

export interface WizardDraft {
  id: string;
  data: Partial<WizardProduct>;
  createdAt: number;
  updatedAt: number;
  status: 'draft' | 'published';
}

export interface StepProps {
  data: Partial<WizardProduct>;
  onDataChange: (data: Partial<WizardProduct>) => void;
  onNext?: () => void;
  categories: Array<{ id: string; name: string }>;
  errors?: Record<string, string>;
}
