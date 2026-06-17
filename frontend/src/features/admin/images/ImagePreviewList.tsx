import React from 'react';
import ImageItem from './ImageItem';
import type { UploadFileState } from './useImageUpload';

interface Props {
    items: UploadFileState[];
    onRemove: (id: string) => void;
    onRetry: (id: string) => void;
    onSetPrimary: (id: string) => void;
}

export default function ImagePreviewList({ items, onRemove, onRetry, onSetPrimary }: Props) {
    return (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            {items.map((it, idx) => (
                <ImageItem key={it.uid} item={it} index={idx} onRemove={onRemove} onRetry={onRetry} onSetPrimary={onSetPrimary} />
            ))}
        </div>
    );
}
