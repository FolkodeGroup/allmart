import React, { useRef } from 'react';

interface RejectedFile { file: File; reason: string }

interface Props {
    multiple?: boolean;
    maxSizeBytes?: number;
    accept?: string[];
    onAddFiles: (files: File[]) => void;
    onReject?: (rejected: RejectedFile[]) => void;
}

export default function ImageUploader({ multiple = true, maxSizeBytes = 5 * 1024 * 1024, accept = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'], onAddFiles, onReject }: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
        const list = e.target.files;
        if (!list) return;
        const files = Array.from(list);
        const accepted: File[] = [];
        const rejected: RejectedFile[] = [];

        for (const f of files) {
            if (!accept.includes(f.type)) {
                rejected.push({ file: f, reason: 'Tipo de archivo no soportado' });
                continue;
            }
            if (f.size > maxSizeBytes) {
                const mb = Math.round(maxSizeBytes / (1024 * 1024));
                rejected.push({ file: f, reason: `Archivo mayor a ${mb}MB` });
                continue;
            }
            accepted.push(f);
        }

        if (accepted.length) onAddFiles(accepted);
        if (rejected.length && onReject) onReject(rejected);

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
