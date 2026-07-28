import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProductRanking } from '../ReportsProductRanking';

describe('ProductRanking', () => {
    it('calls onProductSelect when a product row is clicked', async () => {
        const onProductSelect = vi.fn();
        const products = [
            { id: 'product-1', name: 'Producto A', qty: 3, revenue: 1500, productImage: 'https://example.com/a.jpg' },
        ];

        render(
            <ProductRanking
                products={products}
                maxRevenue={1500}
                formatPrice={(value) => `$${value}`}
                onProductSelect={onProductSelect}
            />
        );

        await userEvent.click(screen.getByRole('button', { name: /producto a/i }));

        expect(onProductSelect).toHaveBeenCalledWith(products[0]);
    });
});
