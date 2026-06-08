/**
 * services/supplierService.ts
 * CRUD + helpers for the Supplier domain.
 */

import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';

export interface SupplierCreateInput {
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  url?: string;
  description?: string;
  isActive?: boolean;
}

export interface SupplierUpdateInput extends Partial<SupplierCreateInput> { }

export interface SuppliersFilter {
  q?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const supplierService = {
  // ── List ────────────────────────────────────────────────────────────────────
  async list(filter: SuppliersFilter = {}) {
    const { q, isActive, page = 1, limit = 6 } = filter;
    const skip = (page - 1) * limit;

    const where = {
      ...(isActive !== undefined ? { isActive } : {}),
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    };

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      include: {
        productSuppliers: {
          where: { isActive: true },
          select: { id: true },
        },
        _count: {
          select: { productSuppliers: true },
        },
      },
    });

    const total = await prisma.supplier.count({ where });

    return {
      data: suppliers.map(s => ({
        ...s,
        productCount: s.productSuppliers.length,
        productSuppliers: undefined,
        _count: undefined,
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  // ── Get by id ────────────────────────────────────────────────────────────────
  async getById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        productSuppliers: {
          where: { isActive: true },
          select: { id: true },
        },
        _count: {
          select: { productSuppliers: true },
        },
      },
    });
    if (!supplier) throw createError('Proveedor no encontrado', 404);
    return {
      ...supplier,
      productCount: supplier.productSuppliers.length,
      productSuppliers: undefined,
      _count: undefined,
    };
  },

  // ── Create ───────────────────────────────────────────────────────────────────
  async create(data: SupplierCreateInput) {
    if (!data.name?.trim()) throw createError('El nombre del proveedor es obligatorio', 400);
    if (!data.email?.trim()) throw createError('El email del proveedor es obligatorio', 400);
    if (!data.phone?.trim()) throw createError('El teléfono del proveedor es obligatorio', 400);

    return prisma.supplier.create({
      data: {
        name: data.name.trim(),
        phone: data.phone.trim(),
        address: data.address?.trim() ?? '',
        email: data.email.trim(),
        url: data.url?.trim() || null,
        description: data.description?.trim() || null,
        isActive: data.isActive ?? true,
        products: '',
      },
    });
  },

  // ── Update ───────────────────────────────────────────────────────────────────
  async update(id: string, data: SupplierUpdateInput) {
    await supplierService.getById(id); // throws 404 if not found

    // Validate required fields when provided
    if (data.name !== undefined && !data.name?.trim()) throw createError('El nombre del proveedor es obligatorio', 400);
    if (data.email !== undefined && !data.email?.trim()) throw createError('El email del proveedor es obligatorio', 400);
    if (data.phone !== undefined && !data.phone?.trim()) throw createError('El teléfono del proveedor es obligatorio', 400);

    return prisma.supplier.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone.trim() } : {}),
        ...(data.address !== undefined ? { address: data.address?.trim() ?? '' } : {}),
        ...(data.email !== undefined ? { email: data.email.trim() } : {}),
        ...(data.url !== undefined ? { url: data.url?.trim() || null } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  },

  // ── Soft-delete ──────────────────────────────────────────────────────────────
  async softDelete(id: string) {
    await supplierService.getById(id);

    // Check for active product relations
    const activeCount = await prisma.productSupplier.count({
      where: { supplierId: id, isActive: true },
    });

    if (activeCount > 0) {
      throw createError(
        `No se puede eliminar: el proveedor tiene ${activeCount} producto(s) activo(s). Desactívalo primero.`,
        409,
      );
    }

    return prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  },

  // ── Products with current price ──────────────────────────────────────────────
  async getProducts(supplierId: string) {
    await supplierService.getById(supplierId);

    const rows = await prisma.productSupplier.findMany({
      where: { supplierId, isActive: true },
      include: {
        product: { select: { id: true, name: true, sku: true, price: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Fetch last price change date per product
    const priceData = await Promise.all(
      rows.map(async row => {
        const lastChange = await prisma.supplierProductPrice.findFirst({
          where: { productId: row.productId, supplierId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true, price: true },
        });

        const prevChange = await prisma.supplierProductPrice.findFirst({
          where: { productId: row.productId, supplierId },
          orderBy: { createdAt: 'desc' },
          skip: 1,
          select: { price: true },
        });

        const currentPrice = Number(row.currentPrice);
        const cost = row.cost ? Number(row.cost) : null;
        const margin = cost !== null && cost > 0 ? ((currentPrice - cost) / cost) * 100 : null;

        const prevPrice = prevChange ? Number(prevChange.price) : null;
        const priceChangePercent =
          prevPrice !== null && prevPrice > 0
            ? ((currentPrice - prevPrice) / prevPrice) * 100
            : null;

        return {
          productId: row.productId,
          productName: row.product.name,
          sku: row.product.sku,
          currentPrice,
          cost,
          margin: margin !== null ? Math.round(margin * 100) / 100 : null,
          lastPriceChange: lastChange?.createdAt ?? null,
          priceChangePercent:
            priceChangePercent !== null ? Math.round(priceChangePercent * 100) / 100 : null,
        };
      }),
    );

    return priceData;
  },

  // ── Price history for all products of a supplier ─────────────────────────────
  async getPriceHistory(
    supplierId: string,
    opts: { startDate?: string; endDate?: string; productId?: string } = {},
  ) {
    await supplierService.getById(supplierId);

    const where: Record<string, unknown> = { supplierId };
    if (opts.productId) where['productId'] = opts.productId;
    if (opts.startDate || opts.endDate) {
      where['createdAt'] = {
        ...(opts.startDate ? { gte: new Date(opts.startDate) } : {}),
        ...(opts.endDate ? { lte: new Date(opts.endDate) } : {}),
      };
    }

    const rows = await prisma.supplierProductPrice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        product: { select: { name: true, sku: true } },
        changedByUser: { select: { firstName: true, lastName: true } },
      },
    });

    return rows.map(r => ({
      id: r.id,
      productId: r.productId,
      productName: r.product.name,
      sku: r.product.sku,
      price: Number(r.price),
      cost: r.cost ? Number(r.cost) : null,
      changeReason: r.changeReason,
      changedBy: r.changedByUser
        ? `${r.changedByUser.firstName} ${r.changedByUser.lastName}`
        : null,
      createdAt: r.createdAt,
    }));
  },
};
