import { forwardRef, useImperativeHandle, useState } from 'react';
import type { RefObject } from 'react';
import styles from '../AdminProductFormPage.module.css';
import {
    DragDropContext,
    Droppable,
    Draggable,
    type DropResult,
    type DroppableProvided,
    type DroppableStateSnapshot,
    type DraggableProvided,
    type DraggableStateSnapshot,
} from '@hello-pangea/dnd';
import { Delete, Star } from 'lucide-react';

/** Imagen de producto en el frontend */
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
    editingImgId: string | null;
    setEditingImgId: (s: string | null) => void;
    editingImgAlt: string;
    setEditingImgAlt: (s: string) => void;
    savingImgId: string | null;
    deletingImgId: string | null;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onApiUploadImage: () => Promise<void>;
    onApiStartEdit: (img: ProductImageItem) => void;
    onApiCommitEdit: (imageId: string) => Promise<void>;
    onApiDeleteImage: (imageId: string) => Promise<void>;
}

export const TabImagenes = forwardRef<TabImagenesRef, TabImagenesProps>(function TabImagenes({
    isEdit,
    images,
    fieldErrors,
    onSetImage,
    onAddImageSlot,
    onRemoveImageSlot,
    apiImages,
    imagesLoading,
    imagesError,
    imgFile,
    setImgFile,
    imgNewAlt,
    setImgNewAlt,
    imgError,
    showAddImgForm,
    setShowAddImgForm,
    editingImgId,
    setEditingImgId,
    editingImgAlt,
    setEditingImgAlt,
    savingImgId,
    deletingImgId,
    fileInputRef,
    onApiUploadImage,
    onApiStartEdit,
    onApiCommitEdit,
    onApiDeleteImage,
}, ref) {
    const [uploadProgress, setUploadProgress] = useState(0);

    useImperativeHandle(ref, () => ({
        validate: () => {
            const errs: Record<string, string> = {};
            if (!isEdit && (!images || images.length === 0 || images.every(img => !img.trim()))) {
                errs.images = 'Agrega al menos una imagen del producto';
            }
            return errs;
        }
    }), [images, isEdit]);

    const handleFileClick = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setUploadProgress(0);
            const previews = Array.from(e.target.files).map((file) => URL.createObjectURL(file));
            onAddImageSlot();
            previews.forEach((preview, i) => {
                onSetImage(images.length + i, preview);
            });
            setUploadProgress(100);
        }
    };

    const handleRemoveImage = (idx: number) => {
        onRemoveImageSlot(idx);
    };

    const handleSetThumbnail = (idx: number) => {
        if (idx > 0) {
            const newImages = [...images];
            [newImages[0], newImages[idx]] = [newImages[idx], newImages[0]];
            newImages.forEach((img, i) => onSetImage(i, img));
        }
    };

    const handleDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;
        if (source.index === destination.index) return;

        const imagesCopy = [...images];
        const [removed] = imagesCopy.splice(source.index, 1);
        imagesCopy.splice(destination.index, 0, removed);
        imagesCopy.forEach((img, i) => onSetImage(i, img));
    };

    if (isEdit) {
        // Modo edición: mostrar imágenes de API
        return (
            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Imágenes del producto</legend>

                {imagesError && <div className={styles.errorText}>{imagesError}</div>}

                {!showAddImgForm ? (
                    <button
                        type="button"
                        className={styles.uploadButton}
                        onClick={() => setShowAddImgForm(true)}
                        disabled={imagesLoading}
                    >
                        + Agregar imagen
                    </button>
                ) : (
                    <div className={styles.uploadSection}>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            ref={fileInputRef}
                            onChange={e => {
                                const files = e.target.files;
                                if (files && files.length > 0) {
                                    setImgFile(files[0]);
                                }
                            }}
                            style={{ display: 'none' }}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={styles.uploadButton}
                        >
                            📁 Seleccionar archivo(s)
                        </button>
                        {imgFile && <p style={{ fontSize: '13px', color: '#6b7280' }}>Archivo: {imgFile.name}</p>}
                        <input
                            type="text"
                            placeholder="Texto alternativo (opcional)"
                            value={imgNewAlt}
                            onChange={e => setImgNewAlt(e.target.value)}
                            className={styles.inputField}
                        />
                        <div>
                            <button
                                type="button"
                                onClick={onApiUploadImage}
                                disabled={!imgFile}
                                className={styles.submitBtn}
                            >
                                ✓ Subir
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddImgForm(false);
                                    setImgFile(null);
                                    setImgNewAlt('');
                                }}
                                className={styles.cancelBtn}
                            >
                                ✕ Cancelar
                            </button>
                        </div>
                        {imgError && <div className={styles.errorText}>{imgError}</div>}
                    </div>
                )}

                {imagesLoading ? (
                    <div>Cargando imágenes...</div>
                ) : (
                    <div className={styles.imagesGrid}>
                        {apiImages.length === 0 && <p>No hay imágenes para este producto.</p>}
                        {apiImages.map((img) => (
                            <div key={img.id} className={styles.imageCard}>
                                <div className={styles.imagePreview}>
                                    <img src={img.url} alt={img.altText || ''} />
                                </div>
                                <div className={styles.imageActions}>
                                    {editingImgId === img.id ? (
                                        <div className={styles.editForm}>
                                            <input
                                                type="text"
                                                value={editingImgAlt}
                                                onChange={e => setEditingImgAlt(e.target.value)}
                                                placeholder="Texto alternativo"
                                                className={styles.inputField}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => onApiCommitEdit(img.id)}
                                                disabled={savingImgId === img.id}
                                                className={styles.submitBtn}
                                            >
                                                {savingImgId === img.id ? 'Guardando...' : 'Guardar'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingImgId(null)}
                                                className={styles.cancelBtn}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => onApiStartEdit(img)}
                                                className={styles.editBtn}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onApiDeleteImage(img.id)}
                                                disabled={deletingImgId === img.id}
                                                className={styles.deleteBtn}
                                                title="Eliminar imagen"
                                            >
                                                <Delete size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </fieldset>
        );
    }

    // Modo creación: mostrar URLs con drag & drop
    return (
        <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Imágenes del producto</legend>
            <p className={styles.fieldHint}>
                Carga imágenes del producto. Arrastra para reordenar. Haz clic en la estrella para establecer como
                imagen destacada.
            </p>

            {/* Upload Input */}
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
                        {uploadProgress > 0 && uploadProgress < 100 ? `Cargando... ${uploadProgress}%` : '+ Agregar imágenes'}
                    </span>
                </label>
            </div>
            {fieldErrors.images && <span className={styles.errorText}>{fieldErrors.images}</span>}

            {/* Images Grid with Drag & Drop */}
            {images.filter(img => img.trim()).length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="images">
                        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={`${styles.imagesGrid} ${snapshot.isDraggingOver ? styles.dragActive : ''}`}
                            >
                                {images.map((url: string, index: number) =>
                                    url.trim() ? (
                                        <Draggable key={`${url}-${index}`} draggableId={`${url}-${index}`} index={index}>
                                            {(dragProvided: DraggableProvided, dragSnapshot: DraggableStateSnapshot) => (
                                                <div
                                                    ref={dragProvided.innerRef}
                                                    {...dragProvided.draggableProps}
                                                    {...dragProvided.dragHandleProps}
                                                    className={`${styles.imageCard} ${dragSnapshot.isDragging ? styles.dragging : ''}`}
                                                >
                                                    <div className={styles.imagePreview}>
                                                        <img src={url} alt={`Imagen ${index + 1}`} />
                                                        {index === 0 && (
                                                            <div className={styles.thumbnailBadge}>
                                                                <Star size={16} fill="gold" />
                                                                Destacada
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={styles.imageActions}>
                                                        {index > 0 && (
                                                            <button
                                                                type="button"
                                                                className={styles.thumbnailBtn}
                                                                onClick={() => handleSetThumbnail(index)}
                                                                title="Establecer como destacada"
                                                            >
                                                                ☆
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className={styles.deleteBtn}
                                                            onClick={() => handleRemoveImage(index)}
                                                            title="Eliminar imagen"
                                                        >
                                                            <Delete size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ) : null
                                )}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            ) : (
                <div className={styles.emptyState}>
                    <p>No hay imágenes. Carga la primera haciendo clic en el botón de arriba.</p>
                </div>
            )}

            {/* Input fields for manual URL entry */}
            <div className={styles.urlInputsSection}>
                {images.map((url, i) => (
                    <div key={i} className={styles.urlInput}>
                        <input
                            type="text"
                            placeholder="URL de la imagen (http/https)"
                            value={url}
                            onChange={e => onSetImage(i, e.target.value)}
                            className={styles.inputField}
                        />
                        <button
                            type="button"
                            onClick={() => handleRemoveImage(i)}
                            className={styles.deleteBtn}
                        >
                            Eliminar
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={onAddImageSlot}
                className={styles.addSlotBtn}
            >
                + Agregar campo para URL
            </button>
        </fieldset>
    );
});
