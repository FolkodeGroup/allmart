import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updatePromotion } from '../promotionsService';
import { prisma } from '../../config/prisma';

vi.mock('../../config/prisma', () => ({
  prisma: {
    promotion: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    promotionRule: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('updatePromotion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets maxDiscount to null when the field is cleared on edit', async () => {
    const today = new Date('2026-01-01T00:00:00.000Z');
    const existingPromotion = {
      id: 'promo-1',
      name: 'Black Friday',
      description: 'BF Productos',
      type: 'fixed',
      value: { toNumber: () => 10 },
      startDate: new Date('2026-06-30T00:00:00.000Z'),
      endDate: new Date('2026-07-23T00:00:00.000Z'),
      minPurchaseAmount: null,
      maxDiscount: { toNumber: () => 300 },
      isActive: true,
      priority: 0,
      createdAt: today,
      updatedAt: today,
      promotionRules: [],
    };

    vi.mocked(prisma.promotion.findUnique)
      .mockResolvedValueOnce(existingPromotion as any)
      .mockResolvedValueOnce({ ...existingPromotion, maxDiscount: null, promotionRules: [] } as any);
    vi.mocked(prisma.promotion.update).mockResolvedValue({} as any);
    vi.mocked(prisma.promotionRule.deleteMany).mockResolvedValue({} as any);

    await updatePromotion('promo-1', { maxDiscount: null });

    expect(prisma.promotion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ maxDiscount: null }),
      })
    );
  });
});
