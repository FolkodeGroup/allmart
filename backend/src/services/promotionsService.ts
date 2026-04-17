/**
 * services/promotionsService.ts
 * CRUD y lógica de negocio para promociones.
 */

import { Decimal } from '@prisma/client/runtime/client';
import { Promotion, PromotionType, PromotionRule, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';

export interface CreatePromotionDTO {
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  startDate: Date;
  endDate: Date;
  minPurchaseAmount?: number;
  maxDiscount?: number;
  isActive?: boolean;
  priority?: number;
  rules?: {
    productIds?: string[];
    categoryIds?: string[];
  };
}

export interface UpdatePromotionDTO {
  name?: string;
  description?: string;
  type?: PromotionType;
  value?: number;
  startDate?: Date;
  endDate?: Date;
  minPurchaseAmount?: number;
  maxDiscount?: number;
  isActive?: boolean;
  priority?: number;
  rules?: {
    productIds?: string[];
    categoryIds?: string[];
  };
}

export interface PromotionResponseDTO {
  id: string;
  name: string;
  description?: string;
  type: string;
  value: number;
  startDate: string;
  endDate: string;
  minPurchaseAmount?: number;
  maxDiscount?: number;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  rules?: {
    productIds: string[];
    categoryIds: string[];
  };
}

function toPromotionDTO(promotion: Promotion): PromotionResponseDTO {
  return {
    id: promotion.id,
    name: promotion.name,
    description: promotion.description ?? undefined,
    type: promotion.type,
    value: promotion.value.toNumber(),
    startDate: promotion.startDate.toISOString(),
    endDate: promotion.endDate.toISOString(),
    minPurchaseAmount: promotion.minPurchaseAmount?.toNumber(),
    maxDiscount: promotion.maxDiscount?.toNumber(),
    isActive: promotion.isActive,
    priority: promotion.priority,
    createdAt: promotion.createdAt.toISOString(),
    updatedAt: promotion.updatedAt.toISOString(),
  };
}

/**
 * Obtiene todas las promociones con paginación
 */
export async function getAllPromotions(
  skip = 0,
  take = 10,
  filters?: { isActive?: boolean; search?: string }
): Promise<{
  data: PromotionResponseDTO[];
  total: number;
}> {
  const where: Prisma.PromotionWhereInput = {};

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [promotions, total] = await Promise.all([
    prisma.promotion.findMany({
      where,
      skip,
      take,
      orderBy: { priority: 'desc' },
    }),
    prisma.promotion.count({ where }),
  ]);

  return {
    data: promotions.map(toPromotionDTO),
    total,
  };
}

/**
 * Obtiene una promoción por ID con sus reglas
 */
export async function getPromotionById(id: string): Promise<any> {
  const promotion = await prisma.promotion.findUnique({
    where: { id },
    include: { promotionRules: true },
  });

  if (!promotion) {
    throw createError('Promoción no encontrada', 404);
  }

  const dto = toPromotionDTO(promotion);
  const productIds = promotion.promotionRules
    .filter((r) => r.productId)
    .map((r) => r.productId!) as string[];
  const categoryIds = promotion.promotionRules
    .filter((r) => r.categoryId)
    .map((r) => r.categoryId!) as string[];

  return { ...dto, rules: { productIds, categoryIds } };
}

/**
 * Obtiene promociones activas
 */
export async function getActivePromotions(): Promise<PromotionResponseDTO[]> {
  const now = new Date();
  const promotions = await prisma.promotion.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { priority: 'desc' },
  });

  return promotions.map(toPromotionDTO);
}

/**
 * Crea una nueva promoción con sus reglas
 */
export async function createPromotion(dto: CreatePromotionDTO): Promise<any> {
  // Validaciones
  if (!dto.name || !dto.type || dto.value === undefined) {
    throw createError(
      'Campos requeridos: name, type, value, startDate, endDate',
      400
    );
  }

  if (new Date(dto.endDate) <= new Date(dto.startDate)) {
    throw createError('La fecha de fin debe ser posterior a la fecha de inicio', 400);
  }

  // Crear la promoción
  const promotion = await prisma.promotion.create({
    data: {
      name: dto.name,
      description: dto.description ?? null,
      type: dto.type,
      value: new Decimal(dto.value),
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      minPurchaseAmount: dto.minPurchaseAmount
        ? new Decimal(dto.minPurchaseAmount)
        : null,
      maxDiscount: dto.maxDiscount ? new Decimal(dto.maxDiscount) : null,
      isActive: dto.isActive ?? true,
      priority: dto.priority ?? 0,
    },
  });

  // Agregar reglas si existen
  if (dto.rules) {
    const { productIds = [], categoryIds = [] } = dto.rules;

    // Crear reglas para productos
    for (const productId of productIds) {
      await prisma.promotionRule.create({
        data: {
          promotionId: promotion.id,
          productId,
        },
      });
    }

    // Crear reglas para categorías
    for (const categoryId of categoryIds) {
      await prisma.promotionRule.create({
        data: {
          promotionId: promotion.id,
          categoryId,
        },
      });
    }
  }

  const result = toPromotionDTO(promotion);
  return {
    ...result,
    rules: dto.rules || { productIds: [], categoryIds: [] },
  };
}

/**
 * Actualiza una promoción y sus reglas
 */
export async function updatePromotion(
  id: string,
  dto: UpdatePromotionDTO
): Promise<any> {
  const existing = await prisma.promotion.findUnique({ where: { id } });
  if (!existing) {
    throw createError('Promoción no encontrada', 404);
  }

  const startDate = dto.startDate || existing.startDate;
  const endDate = dto.endDate || existing.endDate;

  if (new Date(endDate) <= new Date(startDate)) {
    throw createError('La fecha de fin debe ser posterior a la fecha de inicio', 400);
  }

  // Actualizar promoción
  const promotion = await prisma.promotion.update({
    where: { id },
    data: {
      name: dto.name,
      description: dto.description,
      type: dto.type,
      value: dto.value !== undefined ? new Decimal(dto.value) : undefined,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      minPurchaseAmount: dto.minPurchaseAmount
        ? new Decimal(dto.minPurchaseAmount)
        : undefined,
      maxDiscount: dto.maxDiscount ? new Decimal(dto.maxDiscount) : undefined,
      isActive: dto.isActive,
      priority: dto.priority,
    },
  });

  // Actualizar reglas si se proporcionan
  if (dto.rules) {
    // Eliminar reglas existentes
    await prisma.promotionRule.deleteMany({ where: { promotionId: id } });

    const { productIds = [], categoryIds = [] } = dto.rules;

    // Crear nuevas reglas para productos
    for (const productId of productIds) {
      await prisma.promotionRule.create({
        data: {
          promotionId: id,
          productId,
        },
      });
    }

    // Crear nuevas reglas para categorías
    for (const categoryId of categoryIds) {
      await prisma.promotionRule.create({
        data: {
          promotionId: id,
          categoryId,
        },
      });
    }
  }

  // Obtener con reglas actualizadas
  const updated = await prisma.promotion.findUnique({
    where: { id },
    include: { promotionRules: true },
  });

  if (!updated) {
    throw createError('Error al actualizar la promoción', 500);
  }

  const result = toPromotionDTO(updated);
  const productIds = updated.promotionRules
    .filter((r) => r.productId)
    .map((r) => r.productId!) as string[];
  const categoryIds = updated.promotionRules
    .filter((r) => r.categoryId)
    .map((r) => r.categoryId!) as string[];

  return { ...result, rules: { productIds, categoryIds } };
}

/**
 * Elimina una promoción y sus reglas
 */
export async function deletePromotion(id: string): Promise<void> {
  const existing = await prisma.promotion.findUnique({ where: { id } });
  if (!existing) {
    throw createError('Promoción no encontrada', 404);
  }

  // Eliminar reglas primero (CASCADE debería manejar esto, pero ser explícito es más seguro)
  await prisma.promotionRule.deleteMany({ where: { promotionId: id } });

  // Eliminar promoción
  await prisma.promotion.delete({ where: { id } });
}

/**
 * Duplica una promoción existente
 */
export async function duplicatePromotion(id: string): Promise<any> {
  const existing = await prisma.promotion.findUnique({
    where: { id },
    include: { promotionRules: true },
  });

  if (!existing) {
    throw createError('Promoción no encontrada', 404);
  }

  // Crear copia con nombre modificado
  const newPromotion = await prisma.promotion.create({
    data: {
      name: `${existing.name} (Copia)`,
      description: existing.description,
      type: existing.type,
      value: existing.value,
      startDate: existing.startDate,
      endDate: existing.endDate,
      minPurchaseAmount: existing.minPurchaseAmount,
      maxDiscount: existing.maxDiscount,
      isActive: false, // Desactivado por defecto
      priority: existing.priority,
    },
  });

  // Copiar reglas
  for (const rule of existing.promotionRules) {
    await prisma.promotionRule.create({
      data: {
        promotionId: newPromotion.id,
        productId: rule.productId,
        categoryId: rule.categoryId,
      },
    });
  }

  const result = await prisma.promotion.findUnique({
    where: { id: newPromotion.id },
    include: { promotionRules: true },
  });

  if (!result) {
    throw createError('Error al crear la copia de la promoción', 500);
  }

  const dto = toPromotionDTO(result);
  const productIds = result.promotionRules
    .filter((r) => r.productId)
    .map((r) => r.productId!) as string[];
  const categoryIds = result.promotionRules
    .filter((r) => r.categoryId)
    .map((r) => r.categoryId!) as string[];

  return { ...dto, rules: { productIds, categoryIds } };
}

/**
 * Obtiene todos los productos asignados a una promoción específica,
 * incluyendo los asignados a través de sus categorías.
 */
export async function getProductsByPromotion(promotionId: string): Promise<{
  directProducts: Array<{ id: string; name: string; slug: string; price: number; status: string; categoryId: string | null }>;
  categoryProducts: Array<{ id: string; name: string; slug: string; price: number; status: string; categoryId: string | null; assignedViaCategory: string }>;
  categories: Array<{ id: string; name: string; slug: string }>;
}> {
  const promotion = await prisma.promotion.findUnique({
    where: { id: promotionId },
    include: { promotionRules: true },
  });

  if (!promotion) {
    throw createError('Promoción no encontrada', 404);
  }

  const directProductIds = promotion.promotionRules
    .filter((r) => r.productId)
    .map((r) => r.productId!) as string[];

  const categoryIds = promotion.promotionRules
    .filter((r) => r.categoryId)
    .map((r) => r.categoryId!) as string[];

  const directProducts = directProductIds.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: directProductIds } },
        select: { id: true, name: true, slug: true, price: true, status: true, categoryId: true },
        orderBy: { name: 'asc' },
      })
    : [];

  const categories = categoryIds.length > 0
    ? await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      })
    : [];

  const categoryProducts = categoryIds.length > 0
    ? (await prisma.product.findMany({
        where: { categoryId: { in: categoryIds }, id: { notIn: directProductIds } },
        select: { id: true, name: true, slug: true, price: true, status: true, categoryId: true },
        orderBy: { name: 'asc' },
      })).map((p) => ({
        ...p,
        assignedViaCategory: categories.find((c) => c.id === p.categoryId)?.name ?? '',
      }))
    : [];

  return {
    directProducts: directProducts.map((p) => ({ ...p, price: p.price.toNumber() })),
    categoryProducts: categoryProducts.map((p) => ({ ...p, price: p.price.toNumber() })),
    categories,
  };
}

/**
 * Asigna o desasigna productos/categorías a una promoción en bloque.
 * Modo 'add': agrega sin tocar existentes.
 * Modo 'remove': elimina solo esos IDs.
 * Modo 'replace': reemplaza completamente.
 */
export async function bulkAssignToPromotion(
  promotionId: string,
  payload: { mode: 'add' | 'remove' | 'replace'; productIds?: string[]; categoryIds?: string[] }
): Promise<void> {
  const existing = await prisma.promotion.findUnique({ where: { id: promotionId } });
  if (!existing) throw createError('Promoción no encontrada', 404);

  const productIds = payload.productIds ?? [];
  const categoryIds = payload.categoryIds ?? [];

  if (payload.mode === 'replace') {
    await prisma.promotionRule.deleteMany({ where: { promotionId } });
    for (const productId of productIds) {
      await prisma.promotionRule.create({ data: { promotionId, productId } });
    }
    for (const categoryId of categoryIds) {
      await prisma.promotionRule.create({ data: { promotionId, categoryId } });
    }
  } else if (payload.mode === 'add') {
    for (const productId of productIds) {
      const exists = await prisma.promotionRule.findFirst({ where: { promotionId, productId } });
      if (!exists) await prisma.promotionRule.create({ data: { promotionId, productId } });
    }
    for (const categoryId of categoryIds) {
      const exists = await prisma.promotionRule.findFirst({ where: { promotionId, categoryId } });
      if (!exists) await prisma.promotionRule.create({ data: { promotionId, categoryId } });
    }
  } else if (payload.mode === 'remove') {
    if (productIds.length > 0) {
      await prisma.promotionRule.deleteMany({ where: { promotionId, productId: { in: productIds } } });
    }
    if (categoryIds.length > 0) {
      await prisma.promotionRule.deleteMany({ where: { promotionId, categoryId: { in: categoryIds } } });
    }
  }
}

/**
 * Resumen de todas las promociones con conteos para la vista de matriz.
 */
export async function getPromotionsMatrix(): Promise<Array<{
  id: string; name: string; type: string; value: number;
  startDate: string; endDate: string; isActive: boolean; priority: number;
  directProductCount: number; categoryCount: number; totalAffectedProducts: number;
}>> {
  const promotions = await prisma.promotion.findMany({
    include: {
      promotionRules: {
        include: {
          product: { select: { id: true } },
          category: { select: { id: true, _count: { select: { products: true } } } },
        },
      },
    },
    orderBy: [{ isActive: 'desc' }, { priority: 'desc' }, { startDate: 'asc' }],
  });

  return promotions.map((p) => {
    const directRules = p.promotionRules.filter((r) => r.productId);
    const categoryRules = p.promotionRules.filter((r) => r.categoryId);
    const productsViaCategories = categoryRules.reduce(
      (sum, r) => sum + (r.category?._count?.products ?? 0), 0
    );
    return {
      id: p.id, name: p.name, type: p.type, value: p.value.toNumber(),
      startDate: p.startDate.toISOString(), endDate: p.endDate.toISOString(),
      isActive: p.isActive, priority: p.priority,
      directProductCount: directRules.length,
      categoryCount: categoryRules.length,
      totalAffectedProducts: directRules.length + productsViaCategories,
    };
  });
}
