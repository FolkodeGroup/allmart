import ImageItem from './ImageItem';
import type { UploadFileState } from './useImageUpload';
import styles from './AdminImages.module.css';

interface Props {
    items: UploadFileState[];
    onRemove: (id: string) => void | Promise<void>;
    onRetry: (id: string) => void;
    onSetPrimary: (id: string) => void;
}

export default function ImagePreviewList({ items, onRemove, onRetry, onSetPrimary }: Props) {
    return (
        <div className={styles.previewList}>
            {items.map((it, idx) => (
                <ImageItem key={it.uid} item={it} index={idx} onRemove={onRemove} onRetry={onRetry} onSetPrimary={onSetPrimary} />
            ))}
        </div>
    );
}
