import { forwardRef, useImperativeHandle, useState } from 'react';
import type { RefObject } from 'react';
import type { SetField } from '../components/types';
import styles from '../AdminProductFormPage.module.css';
import { ModalConfirm } from '../../../../components/ui/ModalConfirm/ModalConfirm';

export interface ProductImageItem {
    id: string;
    productId: string;
    url: string;
    thumbUrl?: string;
    altText?: string | null;
    position: number;
    width?: number;
    height?: number;
    sizeBytes?: number;
}

export type TabImagenesRef = {
    validate: () => Record<string, string>;
};

interface TabImagenesProps {
    isEdit: boolean;
    productId?: string | null;
    images: string[];
    fieldErrors: Record<string, string>;
    setField: SetField;
    onSetImage: (i: number, val: string) => void;
    onAddImageSlot: () => void;
    onRemoveImageSlot: (i: number) => void;
    apiImages: ProductImageItem[];
    imagesLoading: boolean;
    imagesError: string | null;
    imgFile: File | null;
    setImgFile: (f: File | null) => void;
    imgNewAlt: string;
    setImgNewAlt: (s: string) => void;
    imgError: string;
    showAddImgForm: boolean;
    setShowAddImgForm: (b: boolean) => void;
    deletingImgId: string | null;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onApiUploadImage: (file?: File) => Promise<void>;
    onApiDeleteImage: (imageId: string) => Promise<void>;
}

export const TabImagenes = forwardRef<TabImagenesRef, TabImagenesProps>(function TabImagenes({
    isEdit,
    images,
    fieldErrors,
    setField,
    onRemoveImageSlot,
    apiImages,
    imagesLoading,
    setImgFile,
    imgError,
    deletingImgId,
    fileInputRef,
    onApiUploadImage,
    onApiDeleteImage,
}, ref) {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [deleteConfirmImageId, setDeleteConfirmImageId] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
        validate: () => {
            const errs: Record<string, string> = {};
            if (!isEdit && (!images || images.length === 0 || images.every(img => !img.trim()))) {
                errs.images = 'Agrega al menos una imagen del producto';
            }
            return errs;
        }
    }), [images, isEdit]);

    // 🟢 CORRECCIÓN: Leemos las imágenes como Base64 para que el backend pueda subirlas a R2 correctamente.
    const handleFileClick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setUploadProgress(10);
            const files = Array.from(e.target.files);
            
            try {
                const base64Strings = await Promise.all(files.map(file => {
                    return new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            if (event.target?.result) resolve(event.target.result as string);
                            else reject(new Error("Error leyendo el archivo"));
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                }));

                // Limpiamos los strings vacíos que puedan haber quedado por inicialización
                const cleanImages = images.filter(img => img.trim() !== '');
                setField('images', [...cleanImages, ...base64Strings]);
                
                setUploadProgress(100);
                setTimeout(() => setUploadProgress(0), 1500);
            } catch (error) {
                console.error("Error procesando imágenes a Base64:", error);
                setUploadProgress(0);
            }
        }
    };

    const handleRemoveImage = (idx: number) => {
        onRemoveImageSlot(idx);
    };

    if (isEdit) {
        return (
            <>
                <fieldset className={styles.fieldset}>
                    
                    <p className={styles.fieldHint}>
                        Carga imágenes del producto. Las imágenes serán mostradas en el orden que se carguen.
                    </p>
                    <div className={styles.uploadSection}>
                        <label className={styles.uploadLabel} htmlFor="file-upload-input">
                            <input
                                id="file-upload-input"
                                type="file"
                                accept="image/*"
                                multiple
                                ref={fileInputRef}
                                onChange={async e => {
                                    const files = e.target.files;
                                    if (files && files.length > 0) {
                                        const file = files[0];
                                        setImgFile(file);
                                        await onApiUploadImage(file);
                                        if (e.target) e.target.value = '';
                                    }
                                }}
                                style={{ display: 'none' }}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={styles.uploadButton}
                            >
                                <i className="bi bi-cloud-arrow-up-fill" style={{ marginRight: '8px' }}></i>
                                {uploadProgress > 0 && uploadProgress < 100 ? `Cargando... ${uploadProgress}%` : 'Agregar imágenes'}
                            </button>
                        </label>
                        {imgError && <div className={styles.errorText}>{imgError}</div>}
                    </div>

                    {imagesLoading ? (
                        <div className={styles.loadingContainer}>
                             <div className={styles.spinner}></div>
                             <span>Cargando imágenes...</span>
                        </div>
                    ) : (
                        <div className={styles.imagesGrid}>
                            {apiImages.length === 0 && <p className={styles.fieldHint}>No hay imágenes para este producto.</p>}
                            {apiImages.map((img) => (
                                <div key={img.id} className={styles.imageCard}>
                                    <div className={styles.imagePreview}>
                                        <img src={img.url} alt={img.altText || ''} />
                                    </div>
                                    <div className={styles.imageActions}>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteConfirmImageId(img.id)}
                                            disabled={deletingImgId === img.id}
                                            className={styles.deleteBtn}
                                            title="Eliminar imagen"
                                        >
                                            <i className="bi bi-trash3-fill"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </fieldset >
                <ModalConfirm
                    open={deleteConfirmImageId !== null}
                    title="Eliminar imagen"
                    message="¿Estás seguro de que querés eliminar esta imagen?"
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                    onConfirm={async () => {
                        if (deleteConfirmImageId) {
                            await onApiDeleteImage(deleteConfirmImageId);
                            setDeleteConfirmImageId(null);
                        }
                    }}
                    onCancel={() => setDeleteConfirmImageId(null)}
                />
            </>
        );
    }

    return (
        <>
            <fieldset className={styles.fieldset}>
                
                <p className={styles.fieldHint}>
                    Carga imágenes del producto. Las imágenes serán mostradas en el orden que se carguen.
                </p>
                <div className={styles.uploadSection}>
                    <label className={styles.uploadLabel}>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileClick}
                            style={{ display: 'none' }}
                        />
                        <span className={styles.uploadButton}>
                            <i className="bi bi-cloud-arrow-up-fill" style={{ marginRight: '8px' }}></i>
                            {uploadProgress > 0 && uploadProgress < 100 ? `Cargando... ${uploadProgress}%` : 'Agregar imágenes'}
                        </span>
                    </label>
                </div>
                {fieldErrors.images && <span className={styles.errorText}>{fieldErrors.images}</span>}
                {images.filter(img => img.trim()).length > 0 ? (
                    <div className={styles.imagesGrid}>
                        {images.map((url: string, index: number) =>
                            url.trim() ? (
                                <div key={`${url.substring(0,20)}-${index}`} className={styles.imageCard}>
                                    <div className={styles.imagePreview}>
                                        <img src={url} alt={`Imagen ${index + 1}`} />
                                    </div>
                                    <div className={styles.imageActions}>
                                        <button
                                            type="button"
                                            className={styles.deleteBtn}
                                            onClick={() => setDeleteConfirmImageId(index.toString())}
                                            title="Eliminar imagen"
                                        >
                                            <i className="bi bi-trash3-fill"></i>
                                        </button>
                                    </div>
                                </div>
                            ) : null
                        )}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p>No hay imágenes. Carga la primera haciendo clic en el botón de arriba.</p>
                    </div>
                )}
            </fieldset>
            <ModalConfirm
                open={deleteConfirmImageId !== null && !isEdit}
                title="Eliminar imagen"
                message="¿Estás seguro de que querés eliminar esta imagen?"
                confirmText="Eliminar"
                cancelText="Cancelar"
                onConfirm={() => {
                    if (deleteConfirmImageId) {
                        const index = parseInt(deleteConfirmImageId, 10);
                        if (!isNaN(index)) {
                            handleRemoveImage(index);
                        }
                        setDeleteConfirmImageId(null);
                    }
                }}
                onCancel={() => setDeleteConfirmImageId(null)}
            />
        </>
    );
});