/**
 * Hook para validar si un producto está listo para publicación
 */
import type { WizardProduct } from '../features/admin/products/productWizard/types.ts';

interface ChecklistItem {
    id: string;
    label: string;
    isComplete: boolean;
    status: 'complete' | 'incomplete' | 'warning';
}

export function useReadyToPublish(data: Partial<WizardProduct>): {
    isReady: boolean;
    items: ChecklistItem[];
    incompleteItems: ChecklistItem[];
} {
    // Reuse the checklist logic
    const hasName = !!(data.name && data.name.trim().length > 0);
    const hasCategory = !!data.categoryId;
    const hasDescription = !!(data.description && data.description.trim().length > 0);
    const hasVariants = !!(data.variants && data.variants.length > 0);
    const hasImages = !!(data.images && data.images.filter((img) => img).length > 0);

    let hasUniqueSku = false;
    let skuStatus: 'complete' | 'incomplete' | 'warning' = 'incomplete';
    if (data.sku && data.sku.trim().length > 0) {
        hasUniqueSku = true;
        skuStatus = 'complete';
    } else if (hasVariants && data.variants) {
        const skus = data.variants.map((v) => v.sku).filter((s) => s && s.trim().length > 0);
        const uniqueSkus = new Set(skus);
        if (skus.length === data.variants.length && uniqueSkus.size === skus.length) {
            hasUniqueSku = true;
            skuStatus = 'complete';
        } else if (skus.length > 0 && uniqueSkus.size === skus.length) {
            hasUniqueSku = true;
            skuStatus = 'warning';
        }
    }

    let hasPriceDefined = false;
    let priceStatus: 'complete' | 'incomplete' | 'warning' = 'incomplete';
    if (data.price && data.price > 0) {
        hasPriceDefined = true;
        priceStatus = 'complete';
    } else if (hasVariants && data.variants) {
        const prices = data.variants.filter((v) => v.price && v.price > 0);
        if (prices.length === data.variants.length) {
            hasPriceDefined = true;
            priceStatus = 'complete';
        } else if (prices.length > 0) {
            hasPriceDefined = true;
            priceStatus = 'warning';
        }
    }

    const items: ChecklistItem[] = [
        {
            id: 'name',
            label: 'Nombre del producto',
            isComplete: hasName,
            status: hasName ? 'complete' : 'incomplete',
        },
        {
            id: 'category',
            label: 'Categoría',
            isComplete: hasCategory,
            status: hasCategory ? 'complete' : 'incomplete',
        },
        {
            id: 'description',
            label: 'Descripción',
            isComplete: hasDescription,
            status: hasDescription ? 'complete' : 'incomplete',
        },
        {
            id: 'variants',
            label: 'Variante(s)',
            isComplete: hasVariants,
            status: hasVariants ? 'complete' : 'incomplete',
        },
        {
            id: 'images',
            label: 'Imagen(es)',
            isComplete: hasImages,
            status: hasImages ? 'complete' : 'incomplete',
        },
        {
            id: 'sku',
            label: 'SKU único',
            isComplete: hasUniqueSku,
            status: skuStatus,
        },
        {
            id: 'price',
            label: 'Precio definido',
            isComplete: hasPriceDefined,
            status: priceStatus,
        },
    ];

    const isReady = items.every((item) => item.isComplete);
    const incompleteItems = items.filter((item) => !item.isComplete);

    return { isReady, items, incompleteItems };
}
