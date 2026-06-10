/**
 * services/productSupplierService.ts
 * Manages product-supplier relationships and price updates.
 */

import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';

export interface AssignSupplierInput {
  supplierId: string;
  currentPrice: number;
  cost?: number;
  changeReason?: string;
  changedBy?: string;
}

export interface UpdatePriceInput {
  price?: number;
  cost?: number;
  changeReason?: string;
  changedBy?: string;
}

export const productSupplierService = {
  // ── List suppliers for a product ────────────────────────────────────────────
  async listForProduct(productId: string) {
    const rows = await prisma.productSupplier.findMany({
      where: { productId },
      include: {
        supplier: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { primarySupplierId: true },
    });

    return rows.map(r => ({
      id: r.id,
      supplierId: r.supplierId,
      supplierName: r.supplier.name,
      supplierEmail: r.supplier.email,
      supplierPhone: r.supplier.phone,
      supplierIsActive: r.supplier.isActive,
      currentPrice: Number(r.currentPrice),
      cost: r.cost ? Number(r.cost) : null,
      isActive: r.isActive,
      isPrimary: product?.primarySupplierId === r.supplierId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  },

  // ── Assign supplier ──────────────────────────────────────────────────────────
  async assign(productId: string, input: AssignSupplierInput) {
    if (input.currentPrice <= 0) throw createError('El precio debe ser mayor a 0', 400);
    if (input.cost !== undefined && input.cost < 0)
      throw createError('El costo no puede ser negativo', 400);
    if (input.cost !== undefined && input.cost > input.currentPrice)
      throw createError('El costo no puede ser mayor al precio', 400);

    // Verify both exist
    const [product, supplier] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId }, select: { id: true } }),
      prisma.supplier.findUnique({ where: { id: input.supplierId }, select: { id: true } }),
    ]);
    if (!product) throw createError('Producto no encontrado', 404);
    if (!supplier) throw createError('Proveedor no encontrado', 404);

    // Upsert the link
    const ps = await prisma.productSupplier.upsert({
      where: {
        productId_supplierId: { productId, supplierId: input.supplierId },
      },
      create: {
        productId,
        supplierId: input.supplierId,
        currentPrice: input.currentPrice,
        cost: input.cost ?? null,
        isActive: true,
      },
      update: {
        currentPrice: input.currentPrice,
        cost: input.cost ?? null,
        isActive: true,
      },
    });

    // Log price history entry
    await prisma.supplierProductPrice.create({
      data: {
        productId,
        supplierId: input.supplierId,
        price: input.currentPrice,
        cost: input.cost ?? null,
        changeReason: input.changeReason ?? 'regular',
        changedBy: input.changedBy ?? null,
      },
    });

    return ps;
  },

  // ── Update price ─────────────────────────────────────────────────────────────
  async updatePrice(productId: string, supplierId: string, input: UpdatePriceInput) {
    if (input.price !== undefined && input.price <= 0) throw createError('El precio debe ser mayor a 0', 400);
    if (input.cost !== undefined && input.cost < 0)
      throw createError('El costo no puede ser negativo', 400);
    
    // If both price and cost are provided, validate relationship
    if (input.price !== undefined && input.cost !== undefined && input.cost > input.price)
      throw createError('El costo no puede ser mayor al precio', 400);

    const existing = await prisma.productSupplier.findUnique({
      where: { productId_supplierId: { productId, supplierId } },
    });
    if (!existing) throw createError('Relación producto-proveedor no encontrada', 404);

    // Only validate if both are provided
    if (input.price !== undefined && input.cost !== undefined && input.cost > input.price) {
      throw createError('El costo no puede ser mayor al precio de venta', 400);
    }

    const updateData: Record<string, unknown> = {};
    if (input.price !== undefined) updateData['currentPrice'] = input.price;
    if (input.cost !== undefined) updateData['cost'] = input.cost;

    const [updated] = await prisma.$transaction([
      prisma.productSupplier.update({
        where: { productId_supplierId: { productId, supplierId } },
        data: updateData,
      }),
      prisma.supplierProductPrice.create({
        data: {
          productId,
          supplierId,
          price: input.price ?? existing.currentPrice,
          cost: input.cost ?? existing.cost,
          changeReason: input.changeReason ?? 'adjustment',
          changedBy: input.changedBy ?? null,
        },
      }),
    ]);

    return updated;
  },

  // ── Remove (soft-delete) ─────────────────────────────────────────────────────
  async remove(productId: string, supplierId: string) {
    const existing = await prisma.productSupplier.findUnique({
      where: { productId_supplierId: { productId, supplierId } },
    });
    if (!existing) throw createError('Relación producto-proveedor no encontrada', 404);

    return prisma.productSupplier.update({
      where: { productId_supplierId: { productId, supplierId } },
      data: { isActive: false },
    });
  },

  // ── Set primary supplier ──────────────────────────────────────────────────────
  async setPrimary(productId: string, supplierId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) throw createError('Producto no encontrado', 404);

    const ps = await prisma.productSupplier.findUnique({
      where: { productId_supplierId: { productId, supplierId } },
    });
    if (!ps) throw createError('Relación producto-proveedor no encontrada', 404);

    return prisma.product.update({
      where: { id: productId },
      data: { primarySupplierId: supplierId },
      select: { id: true, primarySupplierId: true },
    });
  },

  // ── Price history for a product ──────────────────────────────────────────────
  async getPriceHistory(
    productId: string,
    opts: {
      supplierId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {},
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) throw createError('Producto no encontrado', 404);

    const where: Record<string, unknown> = { productId };
    if (opts.supplierId) where['supplierId'] = opts.supplierId;
    if (opts.startDate || opts.endDate) {
      where['createdAt'] = {
        ...(opts.startDate ? { gte: new Date(opts.startDate) } : {}),
        ...(opts.endDate ? { lte: new Date(opts.endDate) } : {}),
      };
    }

    const rows = await prisma.supplierProductPrice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: opts.limit ?? 200,
      include: {
        supplier: { select: { name: true } },
        changedByUser: { select: { firstName: true, lastName: true } },
      },
    });

    return rows.map(r => ({
      id: r.id,
      supplierId: r.supplierId,
      supplierName: r.supplier.name,
      price: Number(r.price),
      cost: r.cost ? Number(r.cost) : null,
      margin:
        r.cost && Number(r.cost) > 0
          ? Math.round(((Number(r.price) - Number(r.cost)) / Number(r.cost)) * 10000) / 100
          : null,
      changeReason: r.changeReason,
      changedBy: r.changedByUser
        ? `${r.changedByUser.firstName} ${r.changedByUser.lastName}`
        : null,
      createdAt: r.createdAt,
    }));
  },
};
