import { apiFetch } from '../../../utils/apiClient';

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface AdminSupplier {
    id: string;
    name: string;
    url: string | null;
    phone: string;
    address: string;
    products: string;
    createdAt: string;
    updatedAt: string;
}

export type SupplierInput = Omit<AdminSupplier, 'id' | 'createdAt' | 'updatedAt'>;

export const suppliersAdminService = {
    async getAllSuppliers(): Promise<AdminSupplier[]> {
        const body = await apiFetch<ApiSuccess<AdminSupplier[]>>('/api/admin/suppliers');
        return body.data ?? [];
    },

    async getSupplier(id: string): Promise<AdminSupplier | undefined> {
        try {
            const body = await apiFetch<ApiSuccess<AdminSupplier>>(`/api/admin/suppliers/${id}`);
            return body.data;
        } catch {
            return undefined;
        }
    },

    async createSupplier(data: SupplierInput): Promise<AdminSupplier> {
        const body = await apiFetch<ApiSuccess<AdminSupplier>>('/api/admin/suppliers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return body.data;
    },

    async updateSupplier(id: string, data: SupplierInput): Promise<AdminSupplier | undefined> {
        try {
            const body = await apiFetch<ApiSuccess<AdminSupplier>>(`/api/admin/suppliers/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
            return body.data;
        } catch {
            return undefined;
        }
    },

    async deleteSupplier(id: string): Promise<void> {
        await apiFetch(`/api/admin/suppliers/${id}`, { method: 'DELETE' });
    },
};