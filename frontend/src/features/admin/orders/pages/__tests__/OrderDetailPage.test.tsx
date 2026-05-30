/**
 * frontend/src/features/admin/orders/pages/__tests__/OrderDetailPage.test.tsx
 * Tests unitarios para la página de detalle de pedidos.
 * Verifica carga, errores 404, y rendering del contenido.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import OrderDetailPage from '../OrderDetailPage';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminOrders } from '../../../../../context/AdminOrdersContext';
import * as ordersService from '../../ordersService';
import type { Order } from '../../../../../context/AdminOrdersContext';

// Mock hooks and modules
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(),
  };
});

vi.mock('../../../../../context/AdminAuthContext', () => ({
  useAdminAuth: vi.fn(() => ({
    token: 'valid-token',
    can: vi.fn(() => true),
    user: 'admin@example.com',
  })),
}));

vi.mock('../../../../../context/AdminOrdersContext', () => ({
  useAdminOrders: vi.fn(),
}));

vi.mock('../../../../../hooks/useUnsavedChanges', () => ({
  useUnsavedChanges: vi.fn(() => ({
    setIsDirty: vi.fn(),
  })),
}));

vi.mock('../../ordersService', () => ({
  fetchAdminOrderById: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('../../components/OrderStatusBadge', () => ({
  OrderStatusBadge: ({ status }: { status: string }) => <div>{status}</div>,
}));

vi.mock('../../components/OrderStatusSelector', () => ({
<<<<<<< HEAD
  OrderStatusSelector: ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
=======
  OrderStatusSelector: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
>>>>>>> 8a4399d627c096b8936173ed7628ced9195d14ba
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option>pendiente</option>
      <option>confirmado</option>
    </select>
  ),
}));

vi.mock('../../components/OrderTimeline', () => ({
  OrderTimeline: () => <div>Timeline Mock</div>,
}));

vi.mock('../../../../services/adminActivityLogService', () => ({
  logAdminActivity: vi.fn(),
}));

vi.mock('../../../../components/ui/Button/Button', () => ({
  Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void; [key: string]: unknown }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('../../../../components/ui/Tooltip/Tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockOrder: Order = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2024-01-10T00:00:00Z',
  customer: {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
  },
  items: [
    {
      productId: 'product-1',
      productName: 'Product A',
      productImage: 'image.jpg',
      quantity: 2,
      unitPrice: 75.00,
    },
  ],
  total: 150.00,
  status: 'confirmado',
  paymentStatus: 'abonado',
  paidAt: '2024-01-15T00:00:00Z',
  notes: 'Test notes',
};

describe('OrderDetailPage', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as unknown as typeof useParams).mockReturnValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
    (useNavigate as unknown as typeof useNavigate).mockReturnValue(mockNavigate);
    (useAdminOrders as unknown as typeof useAdminOrders).mockReturnValue({
      getOrder: vi.fn(() => null),
    });
  });

  it('should render loading state initially', () => {
    (ordersService.fetchAdminOrderById as unknown as typeof ordersService.fetchAdminOrderById).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <OrderDetailPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Cargando detalles del pedido/)).toBeInTheDocument();
  });

  it('should render order data when loaded successfully', async () => {
    (ordersService.fetchAdminOrderById as unknown as { mockResolvedValue: (val: unknown) => void }).mockResolvedValue(mockOrder);

    render(
      <BrowserRouter>
        <OrderDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/550E8400/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('juan@example.com')).toBeInTheDocument();
  });

  it('should display 404 message when order not found', async () => {
<<<<<<< HEAD
    (ordersService.fetchAdminOrderById as unknown as { mockRejectedValue: (err: unknown) => void }).mockRejectedValue(
=======
    (ordersService.fetchAdminOrderById as unknown as typeof ordersService.fetchAdminOrderById).mockRejectedValue(
>>>>>>> 8a4399d627c096b8936173ed7628ced9195d14ba
      new Error('404 - Pedido no encontrado')
    );

    render(
      <BrowserRouter>
        <OrderDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Pedido no encontrado/)).toBeInTheDocument();
      expect(screen.getByText(/no existe o fue eliminado/)).toBeInTheDocument();
    });
  });

  it('should show back button to navigate to orders list', async () => {
    (ordersService.fetchAdminOrderById as unknown as { mockResolvedValue: (val: unknown) => void }).mockResolvedValue(mockOrder);

    render(
      <BrowserRouter>
        <OrderDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/550E8400/i)).toBeInTheDocument();
    });

    const backButton = screen.getByLabelText('Volver a la lista de pedidos');
    expect(backButton).toBeInTheDocument();
  });

  it('should display error message on API failure', async () => {
    const errorMessage = 'Error de conexión con el servidor';
<<<<<<< HEAD
    (ordersService.fetchAdminOrderById as unknown as { mockRejectedValue: (err: unknown) => void }).mockRejectedValue(
=======
    (ordersService.fetchAdminOrderById as unknown as typeof ordersService.fetchAdminOrderById).mockRejectedValue(
>>>>>>> 8a4399d627c096b8936173ed7628ced9195d14ba
      new Error(errorMessage)
    );

    render(
      <BrowserRouter>
        <OrderDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar el pedido/)).toBeInTheDocument();
    });
  });

  it('should display items quantity when order is loaded', async () => {
    (ordersService.fetchAdminOrderById as unknown as { mockResolvedValue: (val: unknown) => void }).mockResolvedValue(mockOrder);

    render(
      <BrowserRouter>
        <OrderDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Productos · 2 ítems/)).toBeInTheDocument();
    });
  });
});
