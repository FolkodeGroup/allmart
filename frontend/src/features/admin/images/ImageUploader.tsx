import React, { useRef } from 'react';

interface RejectedFile { file: File; reason: string }

interface Props {
    multiple?: boolean;
    maxSizeBytes?: number;
    accept?: string[];
    onAddFiles: (files: File[]) => void;
    onReject?: (rejected: RejectedFile[]) => void;
}

export default function ImageUploader({
    multiple = true,
    maxSizeBytes = 5 * 1024 * 1024,
    accept = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    onAddFiles,
    onReject
}: Props) {
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

        if (inputRef.current) inputRef.current.value = '';
    }

    return (
        <div
            style={{
                border: '2px dashed var(--color-border, #374151)',
                padding: '16px 20px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-bg-secondary, #28353d)',
                boxSizing: 'border-box',
                maxWidth: '100%',
                width: '100%',
                overflow: 'hidden',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, background-color 0.2s ease',
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        >
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                boxSizing: 'border-box',
            }}>
                <div style={{
                    fontSize: '22px',
                    color: 'var(--color-primary, #769282)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <i className="bi bi-cloud-arrow-up-fill" />
                </div>
                <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary, #ffffff)',
                    wordBreak: 'break-word',
                    lineHeight: '1.4',
                }}>
                    Arrastrá y soltá imágenes aquí o hacé clic para explorar
                </div>
                <div style={{
                    fontSize: '12px',
                    color: 'var(--color-text-secondary, #9ca3af)',
                }}>
                    JPG, PNG, WebP (máx. 5 MB)
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    multiple={multiple}
                    accept={accept.join(',')}
                    onChange={onFilesSelected}
                    style={{ display: 'none' }}
                />
            </div>
        </div>
    );
}