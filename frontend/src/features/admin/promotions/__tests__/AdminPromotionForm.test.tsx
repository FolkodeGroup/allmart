import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import AdminPromotionForm from '../AdminPromotionForm';
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
});
