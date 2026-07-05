import type React from 'react';
import type { AdminProduct } from '../../../../context/AdminProductsContext';
import type { Category } from '../../../../types';

export interface TabFormState {
  form: Omit<AdminProduct, 'id'>;
  fieldErrors: Record<string, string>;
  isEdit: boolean;
}

export type SetField = <K extends keyof Omit<AdminProduct, 'id'>>(key: K, value: Omit<AdminProduct, 'id'>[K]) => void;

export interface TabBasicoProps extends TabFormState {
  setField: SetField;
  tagInput: string;
  setTagInput: (val: string) => void;
  featureInput: string;
  setFeatureInput: (val: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onAddFeature: () => void;
  onRemoveFeature: (idx: number) => void;
  errors?: Record<string, string>;
}

export interface TabPreciosInventarioProps extends TabFormState {
  setField: SetField;
  errors?: Record<string, string>;
}

export interface TabSEOPublicacionProps extends TabFormState {
  setField: SetField;
}

export interface TabVariantesProps extends TabFormState {
  productId: string | null;
  setField: SetField;
  newGroupName: string;
  setNewGroupName: (val: string) => void;
  newGroupValues: Record<string, string>;
  setNewGroupValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onAddVariantGroup: () => void;
  onRemoveVariantGroup: (groupId: string) => void;
  onAddVariantValue: (groupId: string) => void;
  onRemoveVariantValue: (groupId: string, value: string) => void;
  errors?: Record<string, string>;
}

export interface TabCategoriasProps extends TabFormState {
  setField: SetField;
  categories: Category[];
  additionalCategoryIds: string[];
  onPrimaryCategoryChange: (value: string) => void;
  onAdditionalCategoriesChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  getCategoryLabel: (category: { id: string; name: string; parentId?: string | null }) => string;
}