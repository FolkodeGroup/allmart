import { useState, useCallback } from 'react';
import { uploadProductImage } from './productImagesService';
import { uploadSkuImage } from './skuImagesService';

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export type UploadFileState = {
    uid: string; // local id
    file?: File; // present for local files
    previewUrl?: string; // URL.createObjectURL
    remoteUrl?: string; // returned by server
    status: UploadStatus;
    progress?: number;
    errorMessage?: string | null;
    id?: string; // remote db id
    isPrimary?: boolean;
}

interface UseImageUploadOptions {
    token: string;
    productId: string;
    skuId?: string;
    maxSizeBytes?: number;
}

export function useImageUpload({ token, productId, skuId, maxSizeBytes = 5 * 1024 * 1024 }: UseImageUploadOptions) {
    const [files, setFiles] = useState<UploadFileState[]>([]);

    const addFiles = useCallback((incoming: File[]) => {
        const filtered = incoming.filter(f => f.size <= maxSizeBytes);
        const next = filtered.map(f => {
            const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            return { uid, file: f, previewUrl: URL.createObjectURL(f), status: 'pending' as UploadStatus, progress: 0 } as UploadFileState;
        });
        setFiles((s) => [...s, ...next]);
    }, [maxSizeBytes]);

    const remove = useCallback((uid: string) => {
        setFiles((s) => s.filter(x => x.uid !== uid));
    }, []);

    const setPrimary = useCallback((uid: string) => {
        setFiles((s) => s.map(x => ({ ...x, isPrimary: x.uid === uid })));
    }, []);

    const uploadAll = useCallback(async () => {
        for (const f of files) {
            if (f.status !== 'pending' || !f.file) continue;
            try {
                setFiles(s => s.map(x => x.uid === f.uid ? { ...x, status: 'uploading', progress: 10 } : x));
                const res = skuId
                    ? await uploadSkuImage(token ?? '', productId, skuId, f.file!)
                    : await uploadProductImage(token ?? '', productId, f.file!);
                setFiles(s => s.map(x => x.uid === f.uid ? { ...x, status: 'success', progress: 100, remoteUrl: res.url, id: res.id } : x));
            } catch (err: unknown) {
                let msg = 'Error';
                if (err && typeof err === 'object' && 'message' in err) {
                    const m = (err as { message?: unknown }).message;
                    if (typeof m === 'string') msg = m;
                }
                setFiles(s => s.map(x => x.uid === f.uid ? { ...x, status: 'error', errorMessage: msg ?? 'Error', progress: 0 } : x));
            }
        }
    }, [files, productId, token, skuId]);

    const retry = useCallback(async (uid: string) => {
        const f = files.find(x => x.uid === uid);
        if (!f || !f.file) return;
        setFiles(s => s.map(x => x.uid === uid ? { ...x, status: 'uploading', progress: 10, errorMessage: null } : x));
        try {
            const res = skuId
                ? await uploadSkuImage(token ?? '', productId, skuId, f.file)
                : await uploadProductImage(token ?? '', productId, f.file);
            setFiles(s => s.map(x => x.uid === uid ? { ...x, status: 'success', progress: 100, remoteUrl: res.url, id: res.id } : x));
        } catch (err: unknown) {
            let msg = 'Error';
            if (err && typeof err === 'object' && 'message' in err) {
                const m = (err as { message?: unknown }).message;
                if (typeof m === 'string') msg = m;
            }
            setFiles(s => s.map(x => x.uid === uid ? { ...x, status: 'error', errorMessage: msg ?? 'Error', progress: 0 } : x));
        }
    }, [files, productId, token, skuId]);

    return {
        files,
        addFiles,
        remove,
        setPrimary,
        uploadAll,
        retry,
        setFiles,
    } as const;
}
