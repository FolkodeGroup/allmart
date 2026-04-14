// src/features/admin/products/components/tabs/types.ts
import type { AdminProduct } from '../../../../context/AdminProductsContext';
import type { ProductImageItem } from '../../../../context/AdminImagesContext';

/**
 * Estado compartido del formulario pasado a todos los tabs.
 * El estado vive en AdminProductForm; los tabs son componentes puros de presentación.
 */
export interface TabFormState {
    form: Omit<AdminProduct, 'id'>;
    fieldErrors: Record<string, string>;
    isEdit: boolean;
}

/**
 * Setter tipado para el campo del formulario.
 */
export type SetField = <K extends keyof Omit<AdminProduct, 'id'>>(
    key: K,
    value: Omit<AdminProduct, 'id'>[K]
) => void;

// ── Tab Básico ───────────────────────────────────────────────────────────────
export interface TabBasicoProps extends TabFormState {
    errors?: Record<string, string>;
    setField: SetField;
    tagInput: string;
    setTagInput: (v: string) => void;
    featureInput: string;
    setFeatureInput: (v: string) => void;
    onAddTag: () => void;
    onRemoveTag: (tag: string) => void;
    onAddFeature: () => void;
    onRemoveFeature: (index: number) => void;
}

// ── Tab Precios e Inventario ─────────────────────────────────────────────────
export interface TabPreciosInventarioProps extends TabFormState {
    errors?: Record<string, string>;
    setField: SetField;
}

// ── Tab Variantes ────────────────────────────────────────────────────────────
export interface TabVariantesProps extends TabFormState {
    errors?: Record<string, string>;
    setField: SetField;
    newGroupName: string;
    setNewGroupName: (v: string) => void;
    newGroupValues: Record<string, string>;
    setNewGroupValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    onAddVariantGroup: () => void;
    onRemoveVariantGroup: (groupId: string) => void;
    onAddVariantValue: (groupId: string) => void;
    onRemoveVariantValue: (groupId: string, value: string) => void;
}

// ── Tab Imágenes ─────────────────────────────────────────────────────────────
export interface TabImagenesProps {
    errors?: Record<string, string>;
    isEdit: boolean;
    productId?: string | null;
    // Estado para modo creación (URLs)
    images: string[];
    fieldErrors: Record<string, string>;
    onSetImage: (index: number, value: string) => void;
    onAddImageSlot: () => void;
    onRemoveImageSlot: (index: number) => void;
    // Estado para modo edición (API)
    apiImages: ProductImageItem[];
    imagesLoading: boolean;
    imagesError: string | null;
    imgFile: File | null;
    setImgFile: (f: File | null) => void;
    imgNewAlt: string;
    setImgNewAlt: (v: string) => void;
    imgError: string;
    showAddImgForm: boolean;
    setShowAddImgForm: (v: boolean) => void;
    editingImgId: string | null;
    setEditingImgId: (id: string | null) => void;
    editingImgAlt: string;
    setEditingImgAlt: (v: string) => void;
    savingImgId: string | null;
    deletingImgId: string | null;
    // FIX: RefObject<HTMLInputElement> sin `| null` — coincide con useRef<HTMLInputElement>(null)
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onApiUploadImage: () => Promise<void>;
    onApiStartEdit: (img: ProductImageItem) => void;
    onApiCommitEdit: (imageId: string) => Promise<void>;
    onApiDeleteImage: (imageId: string) => Promise<void>;
}

// ── Tab SEO / Publicación ────────────────────────────────────────────────────
export interface TabSEOPublicacionProps extends TabFormState {
    setField: SetField;
}