import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderDetailContent } from '../OrderDetailContent';
import type { Order } from '../../../../../context/AdminOrdersContext';

const mockUpdateOrder = vi.fn();
const mockRefreshOrders = vi.fn();

vi.mock('../../../../../context/AdminOrdersContext', () => ({
  useAdminOrders: () => ({
    updateOrderStatus: vi.fn(),
    updateOrder: mockUpdateOrder,
    deleteOrder: vi.fn(),
    markAsPaid: vi.fn(),
    toggleDeposit: vi.fn(),
    refreshOrders: mockRefreshOrders,
  }),
}));

vi.mock('../../../../../context/AdminAuthContext', () => ({
  useAdminAuth: () => ({
    can: () => true,
    token: 'token-123',
    user: 'admin@example.com',
  }),
}));

vi.mock('../../../../../hooks/useUnsavedChanges', () => ({
  useUnsavedChanges: () => ({ setIsDirty: vi.fn() }),
}));

vi.mock('../../../../../services/adminActivityLogService', () => ({
  logAdminActivity: vi.fn(),
}));

vi.mock('../ordersService', () => ({
  upsertAdminOrderShipment: vi.fn(),
}));

vi.mock('../../../../../components/ui/Tooltip/Tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../../../../components/ui/Modal', () => ({
  Modal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../../../../components/ui/Dropdown/Dropdown', () => ({
  Dropdown: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../OrderStatusBadge', () => ({
  OrderStatusBadge: ({ status }: { status: string }) => <div>{status}</div>,
}));

vi.mock('../OrderStatusSelector', () => ({
  OrderStatusSelector: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="pendiente">pendiente</option>
      <option value="confirmado">confirmado</option>
    </select>
  ),
}));

vi.mock('../OrderTimeline', () => ({
  OrderTimeline: () => <div>Timeline</div>,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const baseOrder: Order = {
  id: 'order-123',
  createdAt: '2024-01-10T00:00:00Z',
  customer: {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
    phone: '1122334455',
  },
  items: [
    {
      productId: 'p-1',
      productName: 'Producto prueba',
      quantity: 1,
      unitPrice: 1500,
    },
  ],
  total: 1500,
  status: 'confirmado',
  notes: 'Nota interna original',
};

describe('OrderDetailContent internal notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateOrder.mockResolvedValue(undefined);
  });

  it('renders the action buttons without the middle saved-note wrapper', () => {
    render(<OrderDetailContent order={baseOrder} onClose={vi.fn()} />);

    expect(screen.getByText('Nota interna original')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /editar nota/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eliminar nota/i })).toBeInTheDocument();
    expect(document.querySelector('.savedNotesBox')).not.toBeInTheDocument();
  });

  it('allows editing and deleting an internal note from the detail view', async () => {
    render(<OrderDetailContent order={baseOrder} onClose={vi.fn()} />);

    expect(screen.getByText('Nota interna original')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /editar nota/i }));

    const editor = screen.getByLabelText(/editar nota interna/i);
    fireEvent.change(editor, { target: { value: 'Nota interna actualizada' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar nota/i }));

    await waitFor(() => {
      expect(mockUpdateOrder).toHaveBeenCalledWith('order-123', { notes: 'Nota interna actualizada' });
    });

    fireEvent.click(screen.getByRole('button', { name: /eliminar nota/i }));

    await waitFor(() => {
      expect(mockUpdateOrder).toHaveBeenCalledWith('order-123', { notes: '' });
    });
  });
});
