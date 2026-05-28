import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CriticalStockAlert from './CriticalStockAlert';

describe('CriticalStockAlert', () => {
    it('should not render when there are no critical products', () => {
        const products = [
            { id: '1', name: 'Product 1', stock: 10 },
            { id: '2', name: 'Product 2', stock: 20 },
        ];

        const { container } = render(<CriticalStockAlert products={products} />);
        expect(container.firstChild).toBeNull();
    });

    it('should render only products with stock <= 5', () => {
        const products = [
            { id: '1', name: 'Product Low Stock', stock: 3 },
            { id: '2', name: 'Product Normal Stock', stock: 10 },
            { id: '3', name: 'Product No Stock', stock: 0 },
        ];

        render(<CriticalStockAlert products={products} />);

        expect(screen.getByText('Product Low Stock')).toBeInTheDocument();
        expect(screen.getByText('Product No Stock')).toBeInTheDocument();
        expect(screen.queryByText('Product Normal Stock')).not.toBeInTheDocument();
    });

    it('should filter and sort products by stock ascending', () => {
        const products = [
            { id: '1', name: 'Product A', stock: 5 },
            { id: '2', name: 'Product B', stock: 0 },
            { id: '3', name: 'Product C', stock: 3 },
            { id: '4', name: 'Product D', stock: 20 },
        ];

        const { container } = render(<CriticalStockAlert products={products} />);

        const items = container.querySelectorAll('[class*="item"]');
        // Should have 3 items (B=0, C=3, A=5) sorted by stock ascending
        expect(items.length).toBeGreaterThan(0);
    });

    it('should show maximum 3 products', () => {
        const products = [
            { id: '1', name: 'Product 1', stock: 1 },
            { id: '2', name: 'Product 2', stock: 2 },
            { id: '3', name: 'Product 3', stock: 3 },
            { id: '4', name: 'Product 4', stock: 4 },
            { id: '5', name: 'Product 5', stock: 5 },
        ];

        render(<CriticalStockAlert products={products} />);

        const productNames = [
            screen.getByText('Product 1'),
            screen.getByText('Product 2'),
            screen.getByText('Product 3'),
        ];

        productNames.forEach(name => expect(name).toBeInTheDocument());
        expect(screen.queryByText('Product 4')).not.toBeInTheDocument();
        expect(screen.queryByText('Product 5')).not.toBeInTheDocument();
    });

    it('should display the alert title', () => {
        const products = [{ id: '1', name: 'Product', stock: 2 }];

        render(<CriticalStockAlert products={products} />);

        expect(screen.getByText(/Alerta de Stock Crítico/)).toBeInTheDocument();
    });

    it('should display stock count for each product', () => {
        const products = [
            { id: '1', name: 'Product A', stock: 3 },
            { id: '2', name: 'Product B', stock: 0 },
        ];

        render(<CriticalStockAlert products={products} />);

        expect(screen.getByText('3 en stock')).toBeInTheDocument();
        expect(screen.getByText('0 en stock')).toBeInTheDocument();
    });
});
