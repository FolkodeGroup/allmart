import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import AdminPromotionForm from '../AdminPromotionForm';
import * as promotionsModule from '../promotionsService';
import { AdminAuthProvider } from '../../../../context/AdminAuthContext';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useBlocker: vi.fn().mockReturnValue({ state: 'unblocked', proceed: vi.fn(), reset: vi.fn() }),
  };
});

vi.mock('../../../../utils/apiClient', () => ({
  apiFetch: vi.fn().mockResolvedValue({ data: { data: [] } }),
}));

vi.mock('../../categories/categoriesService', () => ({
  fetchAdminCategories: vi.fn().mockResolvedValue({ data: [] }),
}));

const Wrapper = ({ children }: { children: ReactNode }) => (
  <AdminAuthProvider>{children}</AdminAuthProvider>
);

const defaultProps = {
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

const updateSpy = vi.spyOn(promotionsModule.promotionsService, 'update').mockResolvedValue({} as any);

describe('AdminPromotionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reset value to 0 when BOGO type is selected', () => {
    render(
      <Wrapper>
        <AdminPromotionForm {...defaultProps} />
      </Wrapper>
    );

    const typeSelect = screen.getByLabelText('Tipo de Descuento *');
    const valueInput = screen.getByLabelText('Valor *') as HTMLInputElement;

    fireEvent.change(typeSelect, { target: { value: 'fixed' } });
    fireEvent.change(valueInput, { target: { value: '50' } });
    expect(valueInput.value).toBe('50');

    fireEvent.change(typeSelect, { target: { value: 'bogo' } });
    expect(valueInput.value).toBe('0');
  });

  it('should submit null maxDiscount when the field is cleared on edit', async () => {
    const promotion = {
      id: 'promo-1',
      name: 'Black Friday',
      description: 'BF Productos',
      type: 'fixed' as const,
      value: 10,
      startDate: '2026-06-30T00:00:00.000Z',
      endDate: '2026-07-23T00:00:00.000Z',
      minPurchaseAmount: 0,
      maxDiscount: 300,
      isActive: true,
      priority: 0,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-15T00:00:00.000Z',
      rules: { productIds: [], categoryIds: [] },
    };

    render(
      <Wrapper>
        <AdminPromotionForm promotion={promotion} {...defaultProps} />
      </Wrapper>
    );

    const maxDiscountInput = screen.getByLabelText('Descuento Máximo ($)') as HTMLInputElement;
    fireEvent.change(maxDiscountInput, { target: { value: '' } });

    const submitButton = screen.getByRole('button', { name: /actualizar promoción/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'promo-1',
        expect.objectContaining({ maxDiscount: null })
      );
    });
  });
});
