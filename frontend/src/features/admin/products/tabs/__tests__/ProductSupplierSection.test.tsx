import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ProductSupplierSection } from '../ProductSupplierSection';
import type { ProductSupplierEntry } from '../../../suppliers/suppliersAdminService';

vi.mock('../../../suppliers/suppliersAdminService', () => ({
  suppliersAdminService: {
    listSuppliers: vi.fn(),
    getProductSuppliers: vi.fn(),
    assignSupplier: vi.fn(),
    updateProductSupplierPrice: vi.fn(),
    removeProductSupplier: vi.fn(),
  },
}));

let mocks: {
  listSuppliers: ReturnType<typeof vi.fn>;
  getProductSuppliers: ReturnType<typeof vi.fn>;
  assignSupplier: ReturnType<typeof vi.fn>;
  updateProductSupplierPrice: ReturnType<typeof vi.fn>;
  removeProductSupplier: ReturnType<typeof vi.fn>;
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
      assignSupplier: (mod as any).suppliersAdminService.assignSupplier,
      updateProductSupplierPrice: (mod as any).suppliersAdminService.updateProductSupplierPrice,
      removeProductSupplier: (mod as any).suppliersAdminService.removeProductSupplier,
    };

    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    mocks.listSuppliers.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 });
    mocks.getProductSuppliers.mockResolvedValue(mockLinks);
    mocks.assignSupplier.mockResolvedValue(undefined);
    mocks.updateProductSupplierPrice.mockResolvedValue(undefined);
    mocks.removeProductSupplier.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the selected primary supplier as a card when it is chosen from the dropdown and resets the dropdown placeholder', async () => {
    mocks.listSuppliers.mockResolvedValue({
      data: [
        {
          id: 'sup-1',
          name: 'Asia Mayorista',
          url: null,
          phone: '123456789',
          address: 'Test',
          email: 'ventas@asia.com',
          description: null,
          isActive: true,
          productCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    mocks.getProductSuppliers.mockResolvedValueOnce([
      {
        id: 'link-2',
        supplierId: 'sup-2',
        supplierName: 'Europa Mayorista',
        supplierEmail: 'ventas@europa.com',
        supplierPhone: '987654321',
        supplierIsActive: true,
        currentPrice: 20000,
        cost: null,
        isActive: true,
        isPrimary: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    render(
      <ProductSupplierSection
        productId={productId}
        productName="Aplique Exterior LED IP65"
        currentProductPrice={20000}
        primarySupplierId="sup-1"
        onPrimaryChange={vi.fn()}
      />
    );

    expect(await screen.findByText('Seleccione un proveedor')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Abrir modal de actualización de costo para Asia Mayorista/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Abrir modal de actualización de costo para Europa Mayorista/i })).toBeInTheDocument();
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

  it('orders modal table suppliers alphabetically even when the primary supplier is out of order', async () => {
    const alphabetizedLinks: ProductSupplierEntry[] = [
      {
        id: 'link-1',
        supplierId: 'sup-1',
        supplierName: 'Zeta Mayorista',
        supplierEmail: 'ventas@zeta.com',
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
        id: 'link-3',
        supplierId: 'sup-3',
        supplierName: 'Alpha Mayorista',
        supplierEmail: 'ventas@alpha.com',
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

    mocks.getProductSuppliers.mockResolvedValueOnce(alphabetizedLinks);

    render(
      <ProductSupplierSection
        productId={productId}
        productName="Aplique Exterior LED IP65"
        currentProductPrice={20000}
        primarySupplierId="sup-1"
        onPrimaryChange={vi.fn()}
      />
    );

    fireEvent.click(await screen.findByRole('button', { name: /Abrir modal de actualización de costo para Zeta Mayorista/i }));
    const rows = await screen.findAllByRole('row');
    const rowNames = rows
      .slice(1)
      .map(row => within(row).queryByText(/Mayorista/))
      .filter(Boolean)
      .map(el => el?.textContent);

    expect(rowNames).toEqual(['Alpha Mayorista', 'Zeta Mayorista']);
  });

  it('selects a supplier without marking it as primary or showing a clear button in the dropdown', async () => {
    const onPrimaryChange = vi.fn();

    mocks.listSuppliers.mockResolvedValueOnce({
      data: [
        {
          id: 'sup-3',
          name: 'Nueva Mayorista',
          url: null,
          phone: '111222333',
          address: 'Test',
          email: null,
          description: null,
          isActive: true,
          productCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    mocks.getProductSuppliers.mockResolvedValueOnce(mockLinks);

    render(
      <ProductSupplierSection
        productId={productId}
        productName="Aplique Exterior LED IP65"
        currentProductPrice={20000}
        primarySupplierId={primarySupplierId}
        onPrimaryChange={onPrimaryChange}
      />
    );

    fireEvent.click(await screen.findByRole('button', { name: /Seleccione un proveedor/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Nueva Mayorista/i }));

    expect(onPrimaryChange).not.toHaveBeenCalled();
    expect(screen.queryByTitle('Quitar proveedor principal')).not.toBeInTheDocument();
  });

  it('does not change the current primary supplier when selecting Sin proveedor in the dropdown', async () => {
    const onPrimaryChange = vi.fn();

    render(
      <ProductSupplierSection
        productId={productId}
        productName="Aplique Exterior LED IP65"
        currentProductPrice={20000}
        primarySupplierId={primarySupplierId}
        onPrimaryChange={onPrimaryChange}
      />
    );

    fireEvent.click(await screen.findByRole('button', { name: /Seleccione un proveedor/i }));
    fireEvent.click(await screen.findByRole('button', { name: /— Sin proveedor —/i }));

    expect(onPrimaryChange).not.toHaveBeenCalled();
    expect(screen.getByText('Asia Mayorista')).toBeInTheDocument();
    expect(screen.getByText('Principal')).toBeInTheDocument();
  });

  it('removes the clicked supplier from the modal table and closes the modal if it was open for that supplier', async () => {
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
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    mocks.getProductSuppliers.mockResolvedValueOnce([mockLinks[1]]);
    fireEvent.click(screen.getByRole('button', { name: /Remover proveedor Asia Mayorista/i }));

    await waitFor(() => {
      expect(mocks.removeProductSupplier).toHaveBeenCalledWith(productId, 'sup-1');
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: /Abrir modal de actualización de costo para Asia Mayorista/i })).toHaveLength(0);
  });
});
