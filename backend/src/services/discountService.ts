import { Promotion, PromotionRule } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface DiscountResult {
  promotionId: string;
  promotionName: string;
  // unit price of the product
  originalPrice: number;
  // number of units the discount was calculated for
  quantity: number;
  // totals (for the given quantity)
  totalOriginalPrice: number;
  totalDiscountAmount: number;
  totalFinalPrice: number;
  // per-unit values for frontend compatibility
  discountAmount?: number;
  finalPrice?: number;
  // percentage of discount relative to total original price
  discountPercentage: number;
  promotionType: string;
  priority: number;
  // how many free items (for BOGO)
  freeItems?: number;
}

/**
 * Obtiene todas las promociones activas en la fecha actual
 */
export async function getActivePromotions(): Promise<Promotion[]> {
  const now = new Date();
  return prisma.promotion.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { priority: 'desc' },
  });
}

/**
 * Obtiene las reglas de promoción para un producto/categoría específico
 */
export async function getPromotionRulesForProduct(
  productId: string,
  categoryIds: string[] = []
): Promise<PromotionRule[]> {
  return prisma.promotionRule.findMany({
    where: {
      OR: [
        { productId },
        ...(categoryIds.length > 0 ? [{ categoryId: { in: categoryIds } }] : []),
      ],
    },
  });
}

/**
 * Calcula el descuento a aplicar a un producto
 */
export function calculateDiscount(
  promotion: Promotion,
  originalPrice: number,
  quantity: number = 1
): { totalDiscountAmount: number; totalFinalPrice: number; discountPercentage: number; freeItems?: number } {
  let totalDiscountAmount = 0;
  const value = promotion.value.toNumber();

  const totalOriginal = originalPrice * quantity;

  if (promotion.type === 'percentage') {
    totalDiscountAmount = (totalOriginal * value) / 100;
  } else if (promotion.type === 'fixed') {
    // fixed is considered per unit in previous implementation, but keep it simple: cap at totalOriginal
    totalDiscountAmount = value * quantity;
  } else if (promotion.type === 'bogo') {
    // BOGO: free items equal to floor(quantity / 2)
    if (quantity < 2) {
      totalDiscountAmount = 0;
    } else {
      const freeItems = Math.floor(quantity / 2);
      totalDiscountAmount = originalPrice * freeItems;
      // assign freeItems via return
      // will attach in return value
    }
  }

  // Aplicar descuento máximo si existe (se aplica sobre el total)
  if (promotion.maxDiscount) {
    const maxDiscount = promotion.maxDiscount.toNumber();
    totalDiscountAmount = Math.min(totalDiscountAmount, maxDiscount);
  }

  // Asegurar que el descuento no sea negativo ni mayor que el total original
  totalDiscountAmount = Math.max(0, Math.min(totalDiscountAmount, totalOriginal));
  const totalFinalPrice = totalOriginal - totalDiscountAmount;
  const discountPercentage = totalOriginal > 0 ? (totalDiscountAmount / totalOriginal) * 100 : 0;

  const freeItems = promotion.type === 'bogo' && quantity >= 2 ? Math.floor(quantity / 2) : 0;

  return { totalDiscountAmount, totalFinalPrice, discountPercentage, freeItems: freeItems || undefined };
}

/**
 * Obtiene el mejor descuento aplicable a un producto considerando todas las
 * promociones activas que apliquen a este producto o su categoría.
 */
export async function getBestDiscount(
  productId: string,
  originalPrice: number,
  categoryIds: string[] = [],
  quantity: number = 1
): Promise<DiscountResult | null> {
  try {
    // Obtener promociones activas
    const activePromotions = await getActivePromotions();

    if (activePromotions.length === 0) {
      return null;
    }

    // Obtener reglas que aplican a este producto
    const applicableRules = await getPromotionRulesForProduct(productId, categoryIds);

    if (applicableRules.length === 0) {
      return null;
    }

    let bestDiscount: DiscountResult | null = null;

    // Procesar cada promoción aplicable
    for (const rule of applicableRules) {
      const promotion = activePromotions.find((p) => p.id === rule.promotionId);
      if (!promotion) continue;

      // Verificar compra mínima
      if (promotion.minPurchaseAmount) {
        const minAmount = promotion.minPurchaseAmount.toNumber();
        if (originalPrice < minAmount) continue;
      }

      const { totalDiscountAmount, totalFinalPrice, discountPercentage, freeItems } = calculateDiscount(
        promotion,
        originalPrice,
        quantity
      );

      const result: DiscountResult = {
        promotionId: promotion.id,
        promotionName: promotion.name,
        originalPrice,
        quantity,
        totalOriginalPrice: Math.round(originalPrice * quantity * 100) / 100,
        totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
        totalFinalPrice: Math.round(totalFinalPrice * 100) / 100,
        discountAmount: Math.round((totalDiscountAmount / Math.max(1, quantity)) * 100) / 100,
        finalPrice: Math.round((totalFinalPrice / Math.max(1, quantity)) * 100) / 100,
        discountPercentage: Math.round(discountPercentage * 100) / 100,
        promotionType: promotion.type,
        priority: promotion.priority,
        freeItems,
      };

      // Mantener el descuento más favorable (mayor descuento absoluto)
      if (!bestDiscount || result.totalDiscountAmount > bestDiscount.totalDiscountAmount) {
        bestDiscount = result;
      }
    }

    return bestDiscount;
  } catch (error) {
    console.error('Error calculating best discount:', error);
    return null;
  }
}

/**
 * Aplica descuentos a un array de productos resolviendo eficientemente las N+1 queries.
 */
export async function applyDiscountsToProducts(
  products: any[]
): Promise<any[]> {
  if (products.length === 0) return [];

  // 1. Obtener todas las promociones activas una sola vez
  const activePromotions = await getActivePromotions();
  if (activePromotions.length === 0) {
    return products.map(p => ({ ...p, appliedDiscount: null }));
  }

  // 2. Extraer todos los IDs de productos y categorías involucradas para consulta en lotes
  const productIds = products.map(p => p.id as string);
  const allCategoryIds = new Set<string>();
  products.forEach(p => {
    const catIds: string[] = Array.isArray(p.categoryIds)
      ? (p.categoryIds as string[])
      : p.categoryId ? [p.categoryId as string] : [];
    catIds.forEach((id: string) => allCategoryIds.add(id));
  });

  // 3. Consultar todas las reglas aplicables en una sola llamada
  const rules = await prisma.promotionRule.findMany({
    where: {
      OR: [
        { productId: { in: productIds } },
        { categoryId: { in: Array.from(allCategoryIds) } }
      ]
    }
  });

  // Mapear reglas en memoria para acceso inmediato de O(1)
  const rulesByProduct = new Map<string, typeof rules>();
  const rulesByCategory = new Map<string, typeof rules>();

  rules.forEach(rule => {
    if (rule.productId) {
      const list = rulesByProduct.get(rule.productId) || [];
      list.push(rule);
      rulesByProduct.set(rule.productId, list);
    }
    if (rule.categoryId) {
      const list = rulesByCategory.get(rule.categoryId) || [];
      list.push(rule);
      rulesByCategory.set(rule.categoryId, list);
    }
  });

  // 4. Calcular el mejor descuento en memoria sin sobrecargar la base de datos
  return products.map(product => {
    const price = product.price.toNumber ? product.price.toNumber() : Number(product.price);
    const catIds: string[] = Array.isArray(product.categoryIds)
      ? (product.categoryIds as string[])
      : product.categoryId ? [product.categoryId as string] : [];

    const prodRules = rulesByProduct.get(product.id) || [];
    const catRules = catIds.flatMap((catId: string) => rulesByCategory.get(catId) || []);
    const applicableRules = [...prodRules, ...catRules];

    let bestDiscount: any = null;

    for (const rule of applicableRules) {
      const promotion = activePromotions.find(p => p.id === rule.promotionId);
      if (!promotion) continue;

      if (promotion.minPurchaseAmount) {
        const minAmount = promotion.minPurchaseAmount.toNumber();
        if (price < minAmount) continue;
      }

      const { totalDiscountAmount, totalFinalPrice, discountPercentage, freeItems } = calculateDiscount(
        promotion,
        price,
        1
      );

      const result = {
        promotionId: promotion.id,
        promotionName: promotion.name,
        originalPrice: price,
        quantity: 1,
        totalOriginalPrice: Math.round(price * 1 * 100) / 100,
        totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
        totalFinalPrice: Math.round(totalFinalPrice * 100) / 100,
          discountAmount: Math.round((totalDiscountAmount / Math.max(1, 1)) * 100) / 100,
          finalPrice: Math.round((totalFinalPrice / Math.max(1, 1)) * 100) / 100,
          discountPercentage: Math.round(discountPercentage * 100) / 100,
        promotionType: promotion.type,
        priority: promotion.priority,
        freeItems,
      };

      if (!bestDiscount || result.totalDiscountAmount > bestDiscount.totalDiscountAmount) {
        bestDiscount = result;
      }
    }

    return {
      ...product,
      appliedDiscount: bestDiscount,
    };
  });
}

/**
 * Obtiene descuentos activos para mostrar (útil para badges)
 */
export async function getActiveDiscounts(): Promise<
  {
    productId: string;
    discount: DiscountResult;
  }[]
> {
  const activePromotions = await getActivePromotions();

  if (activePromotions.length === 0) {
    return [];
  }

  const discounts: { productId: string; discount: DiscountResult }[] = [];
  const processedProducts = new Set<string>();

  for (const promotion of activePromotions) {
    const rules = await prisma.promotionRule.findMany({
      where: { promotionId: promotion.id, productId: { not: null } },
      include: { product: true },
    });

    for (const rule of rules) {
      if (!rule.productId || !rule.product || processedProducts.has(rule.productId)) continue;

      const product = rule.product;
      const originalPrice = product.price.toNumber();

      const { totalDiscountAmount, totalFinalPrice, discountPercentage, freeItems } = calculateDiscount(
        promotion,
        originalPrice,
        1
      );

      discounts.push({
        productId: rule.productId,
        discount: {
          promotionId: promotion.id,
          promotionName: promotion.name,
          originalPrice,
          quantity: 1,
          totalOriginalPrice: Math.round(originalPrice * 1 * 100) / 100,
          totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
          totalFinalPrice: Math.round(totalFinalPrice * 100) / 100,
          discountAmount: Math.round((totalDiscountAmount / Math.max(1, 1)) * 100) / 100,
          finalPrice: Math.round((totalFinalPrice / Math.max(1, 1)) * 100) / 100,
          discountPercentage: Math.round(discountPercentage * 100) / 100,
          promotionType: promotion.type,
          priority: promotion.priority,
          freeItems,
        },
      });

      processedProducts.add(rule.productId);
    }
  }

  return discounts;
}