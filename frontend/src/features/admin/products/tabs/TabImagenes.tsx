// src/features/admin/products/components/tabs/TabImagenes.tsx
import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import type { TabImagenesProps } from '../components/types';

export type TabImagenesRef = {
    validate: () => Record<string, string>;
};
import { ProductImage } from '../../../../components/ui/ProductImage';
import styles from '../AdminProductForm.module.css';

export const TabImagenes = forwardRef<TabImagenesRef, TabImagenesProps>(function TabImagenes({
    isEdit,
    productId: _productId,
    images,
    errors = {},
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
    const [localErrors, setLocalErrors] = useState<Record<string, string>>(errors);

    useImperativeHandle(ref, () => ({
        validate: () => {
            const errs: Record<string, string> = {};
            // Ejemplo: validar URLs de imágenes
            if (images.some(url => url && !url.startsWith('http'))) errs.images = 'Todas las URLs deben ser válidas';
            setLocalErrors(errs);
            return errs;
        }
    }), [images]);
    // FIX: reemplazar autoFocus (jsx-a11y/no-autofocus) con focus programático via useRef + useEffect
    const altInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (editingImgId && altInputRef.current) {
            altInputRef.current.focus();
        }
    }, [editingImgId]);

    return (
        <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Galería de Imágenes</legend>

            {localErrors.images && (
                <span className={styles.errorText}>{localErrors.images}</span>
            )}
            {isEdit ? (
                <div className={styles.imgManager}>
                    {imagesError && (
                        <p className={styles.imgError} aria-live="polite">
                            Error: {imagesError}
                        </p>
                    )}

                    {imagesLoading && apiImages.length === 0 ? (
                        <div className={styles.imgLoading}>
                            <p>Cargando galería...</p>
                        </div>
                    ) : apiImages.length === 0 ? (
                        <div className={styles.imgEmpty}>
                            <p>No hay imágenes vinculadas. Subí una para mejorar la visualización.</p>
                        </div>
                    ) : (
                        <div className={styles.imgGrid}>
                            {apiImages.map(img => (
                                <div key={img.id} className={styles.imgRow}>
                                    <div className={styles.imgThumb}>
                                        {img.url ? (
                                            <ProductImage
                                                src={img.url}
                                                alt={img.altText ?? 'imagen'}
                                                className={styles.imgThumbImg}
                                                width={60}
                                                height={45}
                                                placeholder="data:image/svg+xml,%3Csvg width='60' height='45' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='60' height='45' fill='%23f3f3f3'/%3E%3C/svg%3E"
                                            />
                                        ) : (
                                            <span className={styles.imgThumbEmpty}>?</span>
                                        )}
                                    </div>

                                    <div className={styles.imgCardContent}>
                                        {editingImgId === img.id ? (
                                            <div className={styles.imgCardEdit}>
                                                {/* FIX: label asociado con htmlFor + id en lugar de autoFocus */}
                                                <label
                                                    htmlFor={`alt-input-${img.id}`}
                                                    className="sr-only"
                                                >
                                                    Texto alternativo de la imagen
                                                </label>
                                                <input
                                                    id={`alt-input-${img.id}`}
                                                    ref={altInputRef}
                                                    className={`${styles.input} ${styles.imgInputSmall}`}
                                                    value={editingImgAlt}
                                                    onChange={e => setEditingImgAlt(e.target.value)}
                                                    placeholder="Texto alternativo"
                                                />
                                                <div className={styles.imgCardActions}>
                                                    <button
                                                        type="button"
                                                        className={styles.imgSaveMiniBtn}
                                                        onClick={() => onApiCommitEdit(img.id)}
                                                        disabled={savingImgId === img.id}
                                                    >
                                                        {savingImgId === img.id ? '...' : '✓'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={styles.imgCancelMiniBtn}
                                                        onClick={() => setEditingImgId(null)}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={styles.imgCardMeta}>
                                                <span
                                                    className={styles.imgCardAlt}
                                                    title={img.altText || 'Sin texto alternativo'}
                                                >
                                                    {img.altText || '(Sin texto alternativo)'}
                                                </span>
                                                <div className={styles.imgCardActions}>
                                                    <button
                                                        type="button"
                                                        className={styles.imgIconBtn}
                                                        onClick={() => onApiStartEdit(img)}
                                                        title="Editar descripción"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`${styles.imgIconBtn} ${styles.imgIconDelete}`}
                                                        onClick={() => onApiDeleteImage(img.id)}
                                                        disabled={deletingImgId === img.id}
                                                        title="Eliminar imagen"
                                                    >
                                                        {deletingImgId === img.id ? '...' : '🗑️'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className={styles.uploadSection}>
                        {showAddImgForm ? (
                            <div className={styles.uploadBox}>
                                <div className={styles.field}>
                                    {/* FIX: label asociado con htmlFor + id correspondiente */}
                                    <label htmlFor="img-file-input" className={styles.label}>
                                        Seleccionar archivo (WebP, JPG, PNG)
                                    </label>
                                    <input
                                        id="img-file-input"
                                        type="file"
                                        ref={fileInputRef}
                                        className={styles.fileInput}
                                        accept="image/*"
                                        onChange={e => setImgFile(e.target.files?.[0] ?? null)}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label htmlFor="img-alt-new" className={styles.label}>
                                        Descripción (texto alternativo)
                                    </label>
                                    <input
                                        id="img-alt-new"
                                        className={styles.input}
                                        value={imgNewAlt}
                                        onChange={e => setImgNewAlt(e.target.value)}
                                        placeholder="Ej: Vista frontal del producto"
                                    />
                                </div>
                                {imgError && (
                                    <p className={styles.errorText} aria-live="polite">
                                        {imgError}
                                    </p>
                                )}
                                <div className={styles.imgEditActions}>
                                    <button
                                        type="button"
                                        className={styles.imgSaveBtn}
                                        onClick={onApiUploadImage}
                                        disabled={!imgFile || imagesLoading}
                                    >
                                        {imagesLoading ? 'Subiendo...' : 'Subir imagen'}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.imgCancelBtn}
                                        onClick={() => {
                                            setShowAddImgForm(false);
                                            setImgFile(null);
                                            setImgNewAlt('');
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className={styles.uploadTrigger}
                                onClick={() => setShowAddImgForm(true)}
                            >
                                <span className={styles.uploadIcon}>☁️</span> Subir nueva imagen
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className={styles.creationImgs}>
                    <p className={styles.fieldHint}>
                        Podrás subir archivos de imagen reales una vez que el producto sea creado.
                    </p>
                    {images.map((img, i) => (
                        <div key={i} className={styles.tagRow}>
                            <input
                                className={`${styles.input} ${localErrors.images ? styles.inputError : ''}`}
                                id={`img-url-${i}`}
                                value={img}
                                onChange={e => onSetImage(i, e.target.value)}
                                placeholder="URL de imagen externa (opcional)"
                            />
                            {images.length > 1 && (
                                <button
                                    type="button"
                                    className={styles.removeBtn}
                                    onClick={() => onRemoveImageSlot(i)}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                    {localErrors.images && (
                        <span className={styles.errorText} aria-live="polite">
                            {localErrors.images}
                        </span>
                    )}
                    <button type="button" className={styles.addBtn} onClick={onAddImageSlot}>
                        + Agregar URL
                    </button>
                </div>
            )}
        </fieldset>
    );
});