import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ProductSupplierSection } from '../ProductSupplierSection';
import type { ProductSupplierEntry } from '../../../suppliers/suppliersAdminService';

vi.mock('../../../suppliers/suppliersAdminService', () => ({
  suppliersAdminService: {
    listSuppliers: vi.fn(),
    getProductSuppliers: vi.fn(),
    updateProductSupplierPrice: vi.fn(),
  },
}));

let mocks: {
  listSuppliers: ReturnType<typeof vi.fn>;
  getProductSuppliers: ReturnType<typeof vi.fn>;
  updateProductSupplierPrice: ReturnType<typeof vi.fn>;
};

describe('ProductSupplierSection', () => {
  const productId = 'prod-1';
  const primarySupplierId = 'sup-1';

  const mockLinks: ProductSupplierEntry[] = [
    {
      id: 'link-1',
      supplierId: 'sup-1',
      supplierName: 'Asia Mayorista',
      supplierEmail: 'ventas@asia.com',
      supplierPhone: '123456789',
      supplierIsActive: true,
      currentPrice: 20000,
      cost: 15000,
      isActive: true,
      isPrimary: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'link-2',
      supplierId: 'sup-2',
      supplierName: 'Europa Mayorista',
      supplierEmail: 'ventas@europa.com',
      supplierPhone: '987654321',
      supplierIsActive: true,
      currentPrice: 21000,
      cost: null,
      isActive: true,
      isPrimary: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  let updateProductSupplierPriceMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const mod = await import('../../../suppliers/suppliersAdminService');
    mocks = {
      listSuppliers: (mod as any).suppliersAdminService.listSuppliers,
      getProductSuppliers: (mod as any).suppliersAdminService.getProductSuppliers,
      updateProductSupplierPrice: (mod as any).suppliersAdminService.updateProductSupplierPrice,
    };

    mocks.listSuppliers.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 });
    mocks.getProductSuppliers.mockResolvedValue(mockLinks);
    mocks.updateProductSupplierPrice.mockResolvedValue(undefined);
  });

  it('renders supplier cards and opens modal when a card is clicked', async () => {
    render(
      <ProductSupplierSection
        productId={productId}
        productName="Aplique Exterior LED IP65"
        currentProductPrice={20000}
        primarySupplierId={primarySupplierId}
        onPrimaryChange={vi.fn()}
      />
    );

    expect(await screen.findByText('Proveedores asignados')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Abrir modal de actualización de costo para Asia Mayorista/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Abrir modal de actualización de costo para Europa Mayorista/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Abrir modal de actualización de costo para Asia Mayorista/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /Actualizar Costo/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Actualizar Costo/i })).toBeInTheDocument();
    expect(within(dialog).getByText('Proveedores Asignados')).toBeInTheDocument();
    expect(within(dialog).getByText('Europa Mayorista')).toBeInTheDocument();
  });

  it('updates cost inside modal and reflects the new cost in the assigned suppliers table', async () => {
    render(
      <ProductSupplierSection
        productId={productId}
        productName="Aplique Exterior LED IP65"
        currentProductPrice={20000}
        primarySupplierId={primarySupplierId}
        onPrimaryChange={vi.fn()}
      />
    );

    fireEvent.click(await screen.findByRole('button', { name: /Abrir modal de actualización de costo para Asia Mayorista/i }));

    const costInput = screen.getByLabelText('Costo *');
    fireEvent.change(costInput, { target: { value: '16000' } });

    mocks.getProductSuppliers.mockResolvedValueOnce([
      { ...mockLinks[0], cost: 16000 },
      mockLinks[1],
    ]);

    fireEvent.click(screen.getByRole('button', { name: /Actualizar Costo/i }));

    await waitFor(() => {
      expect(mocks.updateProductSupplierPrice).toHaveBeenCalledWith(productId, 'sup-1', expect.objectContaining({ cost: 16000 }));
    });

    const updatedCostElements = await screen.findAllByText((content) => content.includes('16.000'));
    expect(updatedCostElements.length).toBeGreaterThanOrEqual(1);
  });
});
