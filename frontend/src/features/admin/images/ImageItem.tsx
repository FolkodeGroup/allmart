import type { UploadFileState } from './useImageUpload';
import styles from './AdminImages.module.css';

interface Props {
    item: UploadFileState;
    index: number;
    onRemove: (id: string) => void;
    onRetry: (id: string) => void;
    onSetPrimary: (id: string) => void;
}

export default function ImageItem({ item, onRemove, onRetry, onSetPrimary }: Props) {
    const src = item.previewUrl ?? item.remoteUrl ?? '';
    return (
        <div className={styles.previewItem}>
            <button type="button" title='Eliminar imagen' aria-label="Eliminar imagen" className={styles.deleteBtn} onClick={() => onRemove(item.uid)}>×</button>
            <div className={styles.previewThumb}>
                {src ? <img src={src} alt={item.file?.name ?? item.remoteUrl} className={styles.previewImg} /> : <div className={styles.thumbPlaceholder}>No preview</div>}
            </div>

            <div className={styles.previewMeta}>
                <small className={styles.previewFileName}>{/* filename hidden per UI */}</small>
                <div>
                    {item.status === 'uploading' && <progress className={styles.progress} value={item.progress ?? 0} max={100} />}
                    {item.status === 'error' && (
                        <div className={styles.errorText}>{item.errorMessage} <button className={styles.retryBtn} onClick={() => onRetry(item.uid)}>Reintentar</button></div>
                    )}
                </div>
            </div>

            <div className={styles.previewActions}>
                <button type="button" className={`${styles.primaryBtn} ${item.isPrimary ? styles.primaryActive : ''}`} disabled={item.isPrimary} onClick={() => onSetPrimary(item.uid)}>
                    {item.isPrimary ? 'Principal' : 'Marcar principal'}
                </button>
            </div>
        </div>
    );
}
