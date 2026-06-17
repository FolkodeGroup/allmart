// src/utils/variantMatching.ts

export interface VariantGroupLike {
    id: string;
    name: string;
    values: string[];
}

export interface SkuLike {
    id: string;
    sku: string;
    attributes?: Record<string, string>;
    stock: number;
    price?: number;
    images?: string[];
}

/** Busca el SKU que coincide EXACTAMENTE con todas las variantes seleccionadas. */
export function findExactSku(
    skus: SkuLike[] | undefined,
    groups: VariantGroupLike[],
    selected: Record<string, string>,
): SkuLike | null {
    if (!skus?.length || groups.length === 0) return null;
    if (groups.some(g => !selected[g.id])) return null;

    return skus.find(sku =>
        groups.every(g => sku.attributes?.[g.name] === selected[g.id])
    ) ?? null;
}

/** Busca un SKU compatible con lo elegido hasta ahora, ignorando grupos sin selección. Sirve para previsualizar imágenes. */
export function findPreviewSku(
    skus: SkuLike[] | undefined,
    groups: VariantGroupLike[],
    selected: Record<string, string>,
): SkuLike | null {
    if (!skus?.length || groups.length === 0) return null;

    return skus.find(sku =>
        groups.every(g => {
            const value = selected[g.id];
            return !value || sku.attributes?.[g.name] === value;
        })
    ) ?? null;
}

/** ¿Existe algún SKU para `value` en `group`, compatible con las demás selecciones actuales? */
export function isVariantValueAvailable(
    skus: SkuLike[] | undefined,
    groups: VariantGroupLike[],
    selected: Record<string, string>,
    group: VariantGroupLike,
    value: string,
): boolean {
    if (!skus?.length) return true; // sin datos de SKU, no restringimos nada

    return skus.some(sku => {
        if (sku.attributes?.[group.name] !== value) return false;
        return groups.every(g => {
            if (g.id === group.id) return true;
            const other = selected[g.id];
            return !other || sku.attributes?.[g.name] === other;
        });
    });
}