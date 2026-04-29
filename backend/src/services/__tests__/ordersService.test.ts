/**
 * backend/src/services/__tests__/ordersService.test.ts
 * Tests unitarios para el servicio de pedidos.
 * Verifica que getOrderById maneja correctamente el 404 y devuelve datos completos.
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import * as ordersService from '../ordersService';
import { prisma } from '../../config/prisma';
import { createError } from '../../middlewares/errorHandler';

// Mock prisma
vi.mock('../../config/prisma', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
    },
  },
}));

describe('ordersService.getOrderById', () => {
  beforeAll(() => {
    vi.clearAllMocks();
  });

  it('should return order with all details when order exists', async () => {
    const mockOrder = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      customerFirstName: 'Juan',
      customerLastName: 'Pérez',
      customerEmail: 'juan@example.com',
      total: 150.00,
      status: 'confirmado',
      paymentStatus: 'abonado',
      paidAt: new Date('2024-01-15'),
      notes: 'Test notes',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-15'),
      orderItems: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          orderId: '550e8400-e29b-41d4-a716-446655440000',
          productId: '550e8400-e29b-41d4-a716-446655440010',
          productName: 'Product A',
          productImage: 'image.jpg',
          quantity: 2,
          unitPrice: 75.00,
        },
      ],
      orderStatusHistory: [
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          orderId: '550e8400-e29b-41d4-a716-446655440000',
          status: 'pendiente',
          changedAt: new Date('2024-01-10'),
          note: 'Pedido creado',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          orderId: '550e8400-e29b-41d4-a716-446655440000',
          status: 'confirmado',
          changedAt: new Date('2024-01-11'),
          note: 'Confirmado por cliente',
        },
      ],
    };

    (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

    const result = await ordersService.getOrderById('550e8400-e29b-41d4-a716-446655440000');

    expect(result).toBeDefined();
    expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.customer.firstName).toBe('Juan');
    expect(result.customer.lastName).toBe('Pérez');
    expect(result.customer.email).toBe('juan@example.com');
    expect(result.total).toBe(150.00);
    expect(result.status).toBe('confirmado');
    expect(result.paymentStatus).toBe('abonado');
    expect(result.items).toHaveLength(1);
    expect(result.statusHistory).toHaveLength(2);
  });

  it('should throw 404 error when order does not exist', async () => {
    (prisma.order.findUnique as any).mockResolvedValue(null);

    await expect(
      ordersService.getOrderById('nonexistent-id')
    ).rejects.toThrow();
  });

  it('should include order items in response', async () => {
    const mockOrder = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      customerFirstName: 'Juan',
      customerLastName: 'Pérez',
      customerEmail: 'juan@example.com',
      total: 300.00,
      status: 'pendiente',
      paymentStatus: 'no-abonado',
      paidAt: null,
      notes: null,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
      orderItems: [
        {
          id: 'item-1',
          orderId: '550e8400-e29b-41d4-a716-446655440000',
          productId: 'product-1',
          productName: 'Product 1',
          productImage: 'img1.jpg',
          quantity: 1,
          unitPrice: 100.00,
        },
        {
          id: 'item-2',
          orderId: '550e8400-e29b-41d4-a716-446655440000',
          productId: 'product-2',
          productName: 'Product 2',
          productImage: 'img2.jpg',
          quantity: 2,
          unitPrice: 100.00,
        },
      ],
      orderStatusHistory: [],
    };

    (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

    const result = await ordersService.getOrderById('550e8400-e29b-41d4-a716-446655440000');

    expect(result.items).toHaveLength(2);
    expect(result.items[0].productName).toBe('Product 1');
    expect(result.items[0].quantity).toBe(1);
    expect(result.items[1].productName).toBe('Product 2');
    expect(result.items[1].quantity).toBe(2);
    expect(result.total).toBe(300.00);
  });

  it('should include status history in response', async () => {
    const mockOrder = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      customerFirstName: 'Juan',
      customerLastName: 'Pérez',
      customerEmail: 'juan@example.com',
      total: 150.00,
      status: 'enviado',
      paymentStatus: 'abonado',
      paidAt: new Date('2024-01-15'),
      notes: null,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-16'),
      orderItems: [],
      orderStatusHistory: [
        {
          id: 'hist-1',
          orderId: '550e8400-e29b-41d4-a716-446655440000',
          status: 'pendiente',
          changedAt: new Date('2024-01-10'),
          note: null,
        },
        {
          id: 'hist-2',
          orderId: '550e8400-e29b-41d4-a716-446655440000',
          status: 'confirmado',
          changedAt: new Date('2024-01-11'),
          note: null,
        },
        {
          id: 'hist-3',
          orderId: '550e8400-e29b-41d4-a716-446655440000',
          status: 'enviado',
          changedAt: new Date('2024-01-16'),
          note: 'Enviado por OCA',
        },
      ],
    };

    (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

    const result = await ordersService.getOrderById('550e8400-e29b-41d4-a716-446655440000');

    expect(result.statusHistory).toHaveLength(3);
    expect(result.statusHistory[0].status).toBe('pendiente');
    expect(result.statusHistory[1].status).toBe('confirmado');
    expect(result.statusHistory[2].status).toBe('enviado');
  });
});
