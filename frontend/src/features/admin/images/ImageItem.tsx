import type { UploadFileState } from './useImageUpload';

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
        <div style={{ border: '1px solid #ddd', padding: 8, borderRadius: 6 }}>
            <div style={{ height: 90, background: '#f6f6f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {src ? <img src={src} alt={item.file?.name ?? item.remoteUrl} style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <div>No preview</div>}
            </div>
            <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <small>{item.file?.name ?? (item.remoteUrl && item.remoteUrl.split('/').pop())}</small>
                <button type="button" onClick={() => onRemove(item.uid)}>Eliminar</button>
            </div>
            <div style={{ marginTop: 6 }}>
                {item.status === 'uploading' && <progress value={item.progress ?? 0} max={100} />}
                {item.status === 'error' && <div style={{ color: 'red' }}>{item.errorMessage}<button onClick={() => onRetry(item.uid)}>Reintentar</button></div>}
                <div style={{ marginTop: 6 }}>
                    <button disabled={item.isPrimary} onClick={() => onSetPrimary(item.uid)}>{item.isPrimary ? 'Principal' : 'Marcar principal'}</button>
                </div>
            </div>
        </div>
    );
}
