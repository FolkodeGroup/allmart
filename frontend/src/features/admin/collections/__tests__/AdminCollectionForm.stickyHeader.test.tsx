import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminCollectionForm from '../AdminCollectionForm';

const onSubmit = vi.fn();
const onCancel = vi.fn();

vi.mock('../../../../context/useAdminProductsContext', () => ({
  useAdminProducts: () => ({ products: [] }),
}));

vi.mock('react-router-dom', () => ({
  useBlocker: () => ({
    state: 'unblocked',
    proceed: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('../../../../hooks/useUnsavedChangesWarning', () => ({
  useUnsavedChangesWarning: () => ({
    showWarning: false,
    confirmNavigation: vi.fn(),
    cancelNavigation: vi.fn(),
    interceptNavigation: vi.fn((cb) => cb && cb()),
    setIsDirty: vi.fn(),
  }),
}));

vi.mock('../../../../utils/apiClient', () => ({
  apiFetch: vi.fn(async () => ({ data: [] })),
}));

vi.mock('../collectionsService', () => ({
  collectionsService: {
    getAllUnpaginated: vi.fn(async () => []),
    create: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
    sync: vi.fn(async () => ({})),
  },
}));

describe('AdminCollectionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies sticky header behavior to the form header', () => {
    render(<AdminCollectionForm onSubmit={onSubmit} onCancel={onCancel} />);

    const header = screen.getByRole('banner');
    expect(header.getAttribute('data-sticky-header')).toBe('true');
  });
});
