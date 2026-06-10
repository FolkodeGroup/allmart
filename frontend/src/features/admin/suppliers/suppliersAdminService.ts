import { apiFetch } from '../../../utils/apiClient';

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

// ─── Legacy types (kept for backward-compat) ─────────────────────────────────

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

export interface ProductPriceHistoryEntry {
    monthKey: string;
    month: string;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    salesCount: number;
}

export interface SupplierProductItem {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    inStock: boolean;
    images: string[];
    category: { id: string; name: string } | null;
}

// ─── New V2 types ────────────────────────────────────────────────────────────

export interface AdminSupplierV2 {
    id: string;
    name: string;
    url: string | null;
    phone: string;
    address: string;
    email: string | null;
    description: string | null;
    isActive: boolean;
    products: string;
    productCount: number;
    createdAt: string;
    updatedAt: string;
}

export type SupplierV2Input = {
    name: string;
    phone?: string;
    address?: string;
    email?: string;
    url?: string;
    description?: string;
    isActive?: boolean;
};

export interface SupplierProductEntry {
    productId: string;
    productName: string;
    sku: string | null;
    currentPrice: number;
    cost: number | null;
    margin: number | null;
    lastPriceChange: string | null;
    priceChangePercent: number | null;
}

export interface PriceHistoryEntry {
    id: string;
    productId: string;
    productName: string;
    sku: string | null;
    price: number;
    cost: number | null;
    changeReason: string;
    changedBy: string | null;
    createdAt: string;
}

export interface ProductSupplierEntry {
    id: string;
    supplierId: string;
    supplierName: string;
    supplierEmail: string | null;
    supplierPhone: string;
    supplierIsActive: boolean;
    currentPrice: number;
    cost: number | null;
    isActive: boolean;
    isPrimary: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProductPriceHistoryDetailEntry {
    id: string;
    supplierId: string;
    supplierName: string;
    price: number;
    cost: number | null;
    margin: number | null;
    changeReason: string;
    changedBy: string | null;
    createdAt: string;
}

export interface SuppliersListResponse {
    data: AdminSupplierV2[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const suppliersAdminService = {
    // ── V2: Suppliers CRUD ────────────────────────────────────────────────────
    async listSuppliers(opts: { q?: string; isActive?: boolean; page?: number; limit?: number } = {}): Promise<SuppliersListResponse> {
        const params = new URLSearchParams();
        if (opts.q) params.set('q', opts.q);
        if (opts.isActive !== undefined) params.set('isActive', String(opts.isActive));
        if (opts.page !== undefined) params.set('page', String(opts.page));
        if (opts.limit !== undefined) params.set('limit', String(opts.limit));
        const qs = params.toString();
        const body = await apiFetch<ApiSuccess<SuppliersListResponse>>(`/api/admin/suppliers${qs ? `?${qs}` : ''}`);
        return body.data;
    },

    async getSupplierV2(id: string): Promise<AdminSupplierV2> {
        const body = await apiFetch<ApiSuccess<AdminSupplierV2>>(`/api/admin/suppliers/${id}`);
        return body.data;
    },

    async createSupplierV2(data: SupplierV2Input): Promise<AdminSupplierV2> {
        const body = await apiFetch<ApiSuccess<AdminSupplierV2>>('/api/admin/suppliers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return body.data;
    },

    async updateSupplierV2(id: string, data: SupplierV2Input): Promise<AdminSupplierV2> {
        const body = await apiFetch<ApiSuccess<AdminSupplierV2>>(`/api/admin/suppliers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return body.data;
    },

    async deleteSupplierV2(id: string): Promise<void> {
        await apiFetch(`/api/admin/suppliers/${id}`, { method: 'DELETE' });
    },

    async getSupplierProducts(supplierId: string): Promise<SupplierProductEntry[]> {
        const body = await apiFetch<ApiSuccess<SupplierProductEntry[]>>(`/api/admin/suppliers/${supplierId}/products`);
        return body.data ?? [];
    },

    async getSupplierPriceHistory(supplierId: string, opts: { startDate?: string; endDate?: string; productId?: string } = {}): Promise<PriceHistoryEntry[]> {
        const params = new URLSearchParams();
        if (opts.startDate) params.set('startDate', opts.startDate);
        if (opts.endDate) params.set('endDate', opts.endDate);
        if (opts.productId) params.set('productId', opts.productId);
        const qs = params.toString();
        const body = await apiFetch<ApiSuccess<PriceHistoryEntry[]>>(`/api/admin/suppliers/${supplierId}/price-history${qs ? `?${qs}` : ''}`);
        return body.data ?? [];
    },

    // ── V2: Product-Supplier ──────────────────────────────────────────────────
    async getProductSuppliers(productId: string): Promise<ProductSupplierEntry[]> {
        const body = await apiFetch<ApiSuccess<ProductSupplierEntry[]>>(`/api/admin/products/${productId}/suppliers`);
        return body.data ?? [];
    },

    async getProductPriceHistory(productId: string, opts: { supplierId?: string; startDate?: string; endDate?: string } = {}): Promise<ProductPriceHistoryDetailEntry[]> {
        const params = new URLSearchParams();
        if (opts.supplierId) params.set('supplierId', opts.supplierId);
        if (opts.startDate) params.set('startDate', opts.startDate);
        if (opts.endDate) params.set('endDate', opts.endDate);
        const qs = params.toString();
        const body = await apiFetch<ApiSuccess<ProductPriceHistoryDetailEntry[]>>(`/api/admin/products/${productId}/suppliers/price-history${qs ? `?${qs}` : ''}`);
        return body.data ?? [];
    },

    async assignSupplier(productId: string, data: { supplierId: string; currentPrice: number; cost?: number; changeReason?: string }): Promise<void> {
        await apiFetch(`/api/admin/products/${productId}/suppliers`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateProductSupplierPrice(productId: string, supplierId: string, data: { price?: number; cost?: number; changeReason?: string }): Promise<void> {
        await apiFetch(`/api/admin/products/${productId}/suppliers/${supplierId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async removeProductSupplier(productId: string, supplierId: string): Promise<void> {
        await apiFetch(`/api/admin/products/${productId}/suppliers/${supplierId}`, { method: 'DELETE' });
    },

    async setPrimarySupplier(productId: string, supplierId: string): Promise<void> {
        await apiFetch(`/api/admin/products/${productId}/suppliers/primary`, {
            method: 'POST',
            body: JSON.stringify({ supplierId }),
        });
    },

    async getAllAdminProducts(): Promise<SupplierProductItem[]> {
        const body = await apiFetch<ApiSuccess<{
            data: Array<{
                id: string;
                name: string;
                sku?: string;
                price: number;
                stock: number;
                inStock: boolean;
                images: string[];
                category?: { id: string; name: string } | null;
            }>;
        }>>('/api/admin/products?limit=200');
        const items = body.data?.data ?? [];
        return items.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku ?? '',
            price: p.price,
            stock: p.stock,
            inStock: p.inStock,
            images: p.images ?? [],
            category: p.category ?? null,
        }));
    },

    // ── Legacy compat ─────────────────────────────────────────────────────────
    async getAllSuppliers(): Promise<AdminSupplier[]> {
        const result = await suppliersAdminService.listSuppliers({ limit: 200 });
        return (result?.data ?? []).map(s => ({
            id: s.id, name: s.name, url: s.url, phone: s.phone,
            address: s.address, products: s.products,
            createdAt: s.createdAt, updatedAt: s.updatedAt,
        }));
    },

    async getSupplier(id: string): Promise<AdminSupplier | undefined> {
        try {
            const s = await suppliersAdminService.getSupplierV2(id);
            return { id: s.id, name: s.name, url: s.url, phone: s.phone, address: s.address, products: s.products, createdAt: s.createdAt, updatedAt: s.updatedAt };
        } catch { return undefined; }
    },

    async createSupplier(data: SupplierInput): Promise<AdminSupplier> {
        const s = await suppliersAdminService.createSupplierV2({ ...data, url: data.url ?? undefined });
        return { id: s.id, name: s.name, url: s.url, phone: s.phone, address: s.address, products: s.products, createdAt: s.createdAt, updatedAt: s.updatedAt };
    },

    async updateSupplier(id: string, data: SupplierInput): Promise<AdminSupplier | undefined> {
        try {
            const s = await suppliersAdminService.updateSupplierV2(id, { ...data, url: data.url ?? undefined });
            return { id: s.id, name: s.name, url: s.url, phone: s.phone, address: s.address, products: s.products, createdAt: s.createdAt, updatedAt: s.updatedAt };
        } catch { return undefined; }
    },

    async deleteSupplier(id: string): Promise<void> {
        await suppliersAdminService.deleteSupplierV2(id);
    },
};