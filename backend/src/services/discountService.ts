/**
 * services/discountService.ts
 * Lógica de cálculo de descuentos basado en promociones activas.
 */

import { Decimal } from '@prisma/client/runtime/client';
import { Promotion, PromotionRule, PromotionType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';

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
  categoryId?: string
): Promise<PromotionRule[]> {
  return prisma.promotionRule.findMany({
    where: {
      OR: [
        { productId },
        { categoryId },
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
    // BOGO: Buy One Get One. El descuento es el 100% del producto más barato
    // En este contexto, lo tratamos como un descuento del producto completo
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
  categoryId?: string
): Promise<DiscountResult | null> {
  try {
    // Obtener promociones activas
    const activePromotions = await getActivePromotions();

    if (activePromotions.length === 0) {
      return null;
    }

    // Obtener reglas que aplican a este producto
    const applicableRules = await getPromotionRulesForProduct(productId, categoryId);

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
 * Aplica descuentos a un array de productos
 */
export async function applyDiscountsToProducts(
  products: any[]
): Promise<any[]> {
  return Promise.all(
    products.map(async (product) => {
      const discount = await getBestDiscount(
        product.id,
        product.price.toNumber ? product.price.toNumber() : product.price,
        product.categoryId
      );

      return {
        ...product,
        appliedDiscount: discount,
      };
    })
  );
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
