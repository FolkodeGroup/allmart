import { forwardRef, useImperativeHandle, useState } from 'react';
import styles from '../AdminProductForm.module.css';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Delete, Star } from 'lucide-react';

export type TabImagenesRef = {
    validate: () => Record<string, string>;
};

interface TabImagenesProps {
    form: any;
    setField: (key: string, value: any) => void;
    isLoading?: boolean;
}

export const TabImagenes = forwardRef<TabImagenesRef, TabImagenesProps>(function TabImagenes({
    form,
    setField,
    isLoading = false,
}: TabImagenesProps, ref) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [uploadProgress, setUploadProgress] = useState(0);

    useImperativeHandle(ref, () => ({
        validate: () => {
            const errs: Record<string, string> = {};
            if (!form.images || form.images.length === 0) {
                errs.images = 'Agrega al menos una imagen del producto';
            }
            setErrors(errs);
            return errs;
        }
    }), [form]);

    const handleFileClick = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setUploadProgress(0);
            const previews = Array.from(e.target.files).map((file) => URL.createObjectURL(file));
            const currentImages = form.images || [];
            setField('images', [...currentImages, ...previews]);
            setUploadProgress(100);
        }
    };

    const handleRemoveImage = (url: string) => {
        const images = (form.images || []).filter((img: string) => img !== url);
        setField('images', images);
    };

    const handleSetThumbnail = (url: string) => {
        const images = form.images || [];
        const index = images.indexOf(url);
        if (index > 0) {
            const newImages = [...images];
            [newImages[0], newImages[index]] = [newImages[index], newImages[0]];
            setField('images', newImages);
        }
    };

    const handleDragEnd = (result: any) => {
        const { source, destination } = result;
        if (!destination) return;
        if (source.index === destination.index) return;

        const images = Array.from(form.images || []);
        const [removed] = images.splice(source.index, 1);
        images.splice(destination.index, 0, removed);
        setField('images', images);
    };

    const images = form.images || [];

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
                        disabled={isLoading}
                        style={{ display: 'none' }}
                    />
                    <span className={styles.uploadButton}>
                        {isLoading ? `Cargando... ${uploadProgress}%` : '+ Agregar imágenes'}
                    </span>
                </label>
            </div>
            {errors.images && <span className={styles.errorText}>{errors.images}</span>}

            {/* Images Grid with Drag & Drop */}
            {images.length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="images">
                        {(provided: any, snapshot: any) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={`${styles.imagesGrid} ${snapshot.isDraggingOver ? styles.dragActive : ''}`}
                            >
                                {images.map((url: string, index: number) => (
                                    <Draggable key={url} draggableId={url} index={index}>
                                        {(dragProvided: any, dragSnapshot: any) => (
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
                                                            onClick={() => handleSetThumbnail(url)}
                                                            title="Establecer como destacada"
                                                        >
                                                            ☆
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className={styles.deleteBtn}
                                                        onClick={() => handleRemoveImage(url)}
                                                        title="Eliminar imagen"
                                                    >
                                                        <Delete size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
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
        </fieldset>
    );
});
