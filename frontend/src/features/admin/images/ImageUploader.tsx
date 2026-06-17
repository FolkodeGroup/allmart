import React, { useRef } from 'react';

interface Props {
    multiple?: boolean;
    maxSizeBytes?: number;
    accept?: string[];
    onAddFiles: (files: File[]) => void;
}

export default function ImageUploader({ multiple = true, maxSizeBytes = 5 * 1024 * 1024, accept = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'], onAddFiles }: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
        const list = e.target.files;
        if (!list) return;
        const arr = Array.from(list).filter(f => f.size <= maxSizeBytes && accept.includes(f.type));
        if (arr.length) onAddFiles(arr);
        // reset
        if (inputRef.current) inputRef.current.value = '';
    }

    return (
        <div style={{ border: '2px dashed #ccc', padding: 12, borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column' }}>
                <div>Arrastra y suelta imágenes aquí o selecciona archivos</div>
                <div>
                    <input ref={inputRef} type="file" multiple={multiple} accept={accept.join(',')} onChange={onFilesSelected} />
                </div>
            </div>
        </div>
    );
}
