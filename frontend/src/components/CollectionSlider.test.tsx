import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CollectionSlider from './CollectionSlider';
import { FavoritesProvider } from './layout/context/FavoritesContext';

describe('CollectionSlider product cards', () => {
    it('renders product metadata and product call-to-action inside collection cards', () => {
        render(
            <MemoryRouter>
                <FavoritesProvider>
                    <CollectionSlider
                        title="Colección de prueba"
                        slug="coleccion-de-prueba"
                        products={[
                            {
                                id: 'prod-1',
                                name: 'Aceite Extra Virgen',
                                slug: 'aceite-extra-virgen',
                                price: 1200,
                                position: 1,
                                category: 'Aceites',
                                imageUrl: 'https://example.com/image.jpg',
                            },
                        ]}
                    />
                </FavoritesProvider>
            </MemoryRouter>
        );

        expect(screen.getByText('Aceites')).toBeTruthy();
        expect(screen.getByText('Aceite Extra Virgen')).toBeTruthy();
        expect(screen.getByRole('link', { name: /ver producto/i })).toBeTruthy();
    });
});
