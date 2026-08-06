import { describe, expect, it, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { prisma } from '../../config/prisma';
import { productSupplierService } from '../productSupplierService';

describe('productSupplierService', () => {
  let productId: string;
  let supplierId: string;

  beforeEach(async () => {
    productId = randomUUID();
    supplierId = randomUUID();
    await prisma.productSupplier.deleteMany({
      where: { productId, supplierId },
    });

    await prisma.product.upsert({
      where: { id: productId },
      update: {},
      create: {
        id: productId,
        name: 'Test product',
        slug: `test-product-${productId}`,
        price: 1000,
        stock: 1,
        inStock: true,
        status: 'active',
      },
    });

    await prisma.supplier.upsert({
      where: { id: supplierId },
      update: {},
      create: {
        id: supplierId,
        name: 'Test supplier',
        phone: '1234',
        address: 'Test address',
        isActive: true,
      },
    });
  });

  it('does not include inactive product-supplier links in listForProduct', async () => {
    await prisma.productSupplier.create({
      data: {
        productId,
        supplierId,
        currentPrice: 1000,
        cost: 500,
        isActive: true,
      },
    });

    let entries = await productSupplierService.listForProduct(productId);
    expect(entries.length).toBe(1);
    expect(entries[0].supplierId).toBe(supplierId);

    await productSupplierService.remove(productId, supplierId);

    entries = await productSupplierService.listForProduct(productId);
    expect(entries.length).toBe(0);
  });
});
