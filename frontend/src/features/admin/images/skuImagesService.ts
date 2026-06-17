import { apiFetch } from '../../../utils/apiClient';

interface ApiSuccess<T> { success: boolean; data: T; message?: string }

export interface ApiSkuImage {
    id: string;
    skuId: string;
    url: string;
    thumbUrl?: string;
    altText?: string | null;
    position: number;
    isPrimary?: boolean;
    createdAt: string;
    updatedAt: string;
}

export async function uploadSkuImage(token: string, productId: string, skuId: string, file: File, altText?: string, position?: number, isPrimary?: boolean): Promise<ApiSkuImage> {
    const form = new FormData();
    form.append('image', file);
    if (altText !== undefined) form.append('altText', altText);
    if (position !== undefined) form.append('position', String(position));
    if (isPrimary !== undefined) form.append('isPrimary', String(isPrimary));
    // NOTE: backend mounts the SKU images router under /api/admin/products/:productId/variants/skus/:skuId/images
    const body = await apiFetch<ApiSuccess<ApiSkuImage>>(`/api/admin/products/${productId}/variants/skus/${skuId}/images/upload`, { method: 'POST', body: form }, token);
    return body.data;
}

export async function fetchSkuImages(token: string, productId: string, skuId: string): Promise<ApiSkuImage[]> {
    const body = await apiFetch<ApiSuccess<ApiSkuImage[]>>(`/api/admin/products/${productId}/variants/skus/${skuId}/images`, {}, token);
    return body.data ?? [];
}

export async function updateSkuImageMeta(token: string, productId: string, skuId: string, imageId: string, payload: { altText?: string | null; position?: number; isPrimary?: boolean }) {
    const body = await apiFetch<ApiSuccess<ApiSkuImage>>(`/api/admin/products/${productId}/variants/skus/${skuId}/images/${imageId}/meta`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
    return body.data;
}
