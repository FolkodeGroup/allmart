import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CartPage } from './CartPage';

const mockUseCart = vi.fn();

vi.mock('../../components/layout/context/CartContextUtils', () => ({
    useCart: () => mockUseCart(),
}));

vi.mock('../../components/ui/ProductImage', () => ({
    ProductImage: ({ alt }: { alt: string }) => <img alt={alt} src="/placeholder.png" />,
}));

vi.mock('../../components/ui/OrderConfirmationForm', () => ({
    OrderConfirmationForm: () => <div>Confirmación</div>,
}));

describe('CartPage', () => {
    it('does not render the category name inside a cart item card', () => {
        mockUseCart.mockReturnValue({
            items: [
                {
                    product: {
                        id: 'p-1',
                        name: 'Camiseta básica',
                        slug: 'camiseta-basica',
                        description: 'Desc',
                        shortDescription: 'Short',
                        price: 1500,
                        images: ['img-1.jpg'],
                        category: { id: 'cat-1', name: 'Ropa', slug: 'ropa', isVisible: true },
                        categoryId: 'cat-1',
                        tags: [],
                        rating: 0,
                        reviewCount: 0,
                        inStock: true,
                        sku: 'SKU-1',
                        selectedAttributes: undefined,
                    },
                    quantity: 1,
                },
            ],
            totalItems: 1,
            totalPrice: 1500,
            removeFromCart: vi.fn(),
            updateQuantity: vi.fn(),
            clearCart: vi.fn(),
        });

        render(
            <MemoryRouter>
                <CartPage />
            </MemoryRouter>
        );

        // There are two links with the product name (image link + name link).
        // Use text lookup to avoid the ambiguous accessible-name match.
        expect(screen.getByText(/camiseta básica/i)).toBeInTheDocument();
        expect(screen.queryByText(/ropa/i)).not.toBeInTheDocument();
    });
});
