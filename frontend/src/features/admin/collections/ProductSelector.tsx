/**
 * features/admin/collections/ProductSelector.tsx
 * Componente para seleccionar productos para agregar a una colección.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { fetchAdminProducts, type ApiProduct } from '../../../features/admin/products/productsService';
import { getStoredToken } from '../../../utils/apiClient';
import styles from './AdminCollections.module.css';

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
}

interface ProductSelectorProps {
  selectedIds: string[];
  onProductsChange: (ids: string[]) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedIds,
  onProductsChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchProducts = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    setShowDropdown(true);
    try {
      const token = getStoredToken();
      if (!token) {
        setError('Token de autenticación no disponible');
        return;
      }
      const result = await fetchAdminProducts(token, { q: query, page: 1, limit: 10 });
      // Filtrar productos que ya están seleccionados
      const filtered = (result.data || []).filter(
        (product: ApiProduct) => !selectedIds.includes(product.id)
      );
      const normalized: Product[] = filtered.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
      }));
      setAvailableProducts(normalized);
      setShowDropdown(true);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Error cargando productos');
    } finally {
      setLoading(false);
    }
  }, [selectedIds]);

  // Cargar productos cuando el usuario escribe
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      fetchProducts(searchQuery.trim());
    } else {
      setAvailableProducts([]);
      setShowDropdown(false);
      setError(null);
    }
  }, [searchQuery, fetchProducts]);

  function handleSelectProduct(product: Product) {
    onProductsChange([...selectedIds, product.id]);
    setSearchQuery('');
    setShowDropdown(false);
  }

  function handleRemoveProduct(productId: string) {
    onProductsChange(selectedIds.filter((id) => id !== productId));
  }

  return (
    <div className={styles.formGroup}>
      <label htmlFor="collection-products-search">Productos en esta colección</label>

      {/* Búsqueda de productos */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <input
          id="collection-products-search"
          type="text"
          placeholder="Buscar productos para agregar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
          style={{ width: '100%' }}
        />

        {showDropdown && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 10,
              marginTop: '4px',
            }}
          >
            {loading && <div style={{ padding: '8px' }}>Cargando...</div>}
            {error && (
              <div style={{ padding: '8px', color: 'red', fontSize: '12px' }}>
                {error}
              </div>
            )}
            {!loading && availableProducts.length === 0 && searchQuery && (
              <div style={{ padding: '8px', fontSize: '12px', color: '#666' }}>
                No hay productos disponibles
              </div>
            )}
            {availableProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelectProduct(product)}
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  fontSize: '14px',
                  width: '100%',
                  textAlign: 'left',
                  background: 'white',
                  border: 'none',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = 'white')
                }
              >
                <strong>{product.name}</strong>
                {product.sku && <span style={{ fontSize: '12px', color: '#999' }}>  (SKU: {product.sku})</span>}
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Precio: ${product.price}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de productos seleccionados */}
      {selectedIds.length > 0 ? (
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: '#f5f5f5',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#666',
            }}
          >
            {selectedIds.length} producto(s) seleccionado(s)
          </div>
          {selectedIds.map((productId) => (
            <div
              key={productId}
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <code style={{ fontSize: '12px' }}>{productId}</code>
              <button
                type="button"
                onClick={() => handleRemoveProduct(productId)}
                style={{
                  background: '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = '#ff5252')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = '#ff6b6b')
                }
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            color: '#999',
            fontSize: '14px',
            textAlign: 'center',
          }}
        >
          Sin productos asignados
        </div>
      )}

      <small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
        Busca y agrega productos a esta colección. Los cambios se guardarán al hacer click en "Crear" o "Actualizar".
      </small>
    </div>
  );
};
