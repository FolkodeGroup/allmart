import { Promotion, PromotionRule } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface DiscountResult {
  promotionId: string;
  promotionName: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  discountPercentage: number;
  promotionType: string;
  priority: number;
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
  originalPrice: number
): { discountAmount: number; finalPrice: number; discountPercentage: number } {
  let discountAmount = 0;
  const value = promotion.value.toNumber();

  if (promotion.type === 'percentage') {
    discountAmount = (originalPrice * value) / 100;
  } else if (promotion.type === 'fixed') {
    discountAmount = value;
  } else if (promotion.type === 'bogo') {
    discountAmount = originalPrice;
  }

  // Aplicar descuento máximo si existe
  if (promotion.maxDiscount) {
    const maxDiscount = promotion.maxDiscount.toNumber();
    discountAmount = Math.min(discountAmount, maxDiscount);
  }

  // Asegurar que el descuento no sea negativo ni mayor que el precio
  discountAmount = Math.max(0, Math.min(discountAmount, originalPrice));
  const finalPrice = originalPrice - discountAmount;
  const discountPercentage =
    originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;

  return { discountAmount, finalPrice, discountPercentage };
}

/**
 * Obtiene el mejor descuento aplicable a un producto considerando todas las
 * promociones activas que apliquen a este producto o su categoría.
 */
export async function getBestDiscount(
  productId: string,
  originalPrice: number,
  categoryIds: string[] = []
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

      const { discountAmount, finalPrice, discountPercentage } = calculateDiscount(
        promotion,
        originalPrice
      );

      const result: DiscountResult = {
        promotionId: promotion.id,
        promotionName: promotion.name,
        originalPrice,
        discountAmount: Math.round(discountAmount * 100) / 100,
        finalPrice: Math.round(finalPrice * 100) / 100,
        discountPercentage: Math.round(discountPercentage * 100) / 100,
        promotionType: promotion.type,
        priority: promotion.priority,
      };

      // Mantener el descuento más favorable (mayor descuento absoluto)
      if (!bestDiscount || result.discountAmount > bestDiscount.discountAmount) {
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

      const { discountAmount, finalPrice, discountPercentage } = calculateDiscount(
        promotion,
        price
      );

      const result = {
        promotionId: promotion.id,
        promotionName: promotion.name,
        originalPrice: price,
        discountAmount: Math.round(discountAmount * 100) / 100,
        finalPrice: Math.round(finalPrice * 100) / 100,
        discountPercentage: Math.round(discountPercentage * 100) / 100,
        promotionType: promotion.type,
        priority: promotion.priority,
      };

      if (!bestDiscount || result.discountAmount > bestDiscount.discountAmount) {
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

      const { discountAmount, finalPrice, discountPercentage } = calculateDiscount(
        promotion,
        originalPrice
      );

      discounts.push({
        productId: rule.productId,
        discount: {
          promotionId: promotion.id,
          promotionName: promotion.name,
          originalPrice,
          discountAmount: Math.round(discountAmount * 100) / 100,
          finalPrice: Math.round(finalPrice * 100) / 100,
          discountPercentage: Math.round(discountPercentage * 100) / 100,
          promotionType: promotion.type,
          priority: promotion.priority,
        },
      });

      processedProducts.add(rule.productId);
    }
  }

  return discounts;
}