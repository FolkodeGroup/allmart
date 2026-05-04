import React, { useState, useEffect, useCallback } from 'react';
import { fetchAdminProducts, type ApiProduct } from '../../../features/admin/products/productsService';
import { getStoredToken } from '../../../utils/apiClient';
import { normalizeImageUrl } from '../../../utils/imageUrl';
import { ProductRow, type ProductRowData } from '../../../components/ProductRow';
import styles from './AdminCollections.module.css';

interface ProductSelectorProps {
  selectedIds: string[];
  onProductsChange: (ids: string[]) => void;
  initialProducts?: ProductRowData[];
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedIds,
  onProductsChange,
  initialProducts = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<ProductRowData[]>(initialProducts); // inicializar con los existentes
  const [availableProducts, setAvailableProducts] = useState<ProductRowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Sincronizar si initialProducts llega tarde (fetch async en el padre)
  useEffect(() => {
    if (initialProducts.length > 0 && selectedProducts.length === 0) {
      setSelectedProducts(initialProducts);
    }
  }, [initialProducts]);

  const fetchProducts = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    setShowDropdown(true);
    try {
      const token = getStoredToken();
      if (!token) { setError('Token de autenticación no disponible'); return; }

      const result = await fetchAdminProducts(token, { q: query, page: 1, limit: 10 });
      const filtered = (result.data || [])
        .filter((p: ApiProduct) => !selectedIds.includes(p.id))
        .map((p: ApiProduct): ProductRowData => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: p.price,
          imageUrl: normalizeImageUrl(p.images?.[0]),
        }));

      setAvailableProducts(filtered);
    } catch {
      setError('Error cargando productos');
    } finally {
      setLoading(false);
    }
  }, [selectedIds]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      fetchProducts(searchQuery.trim());
    } else {
      setAvailableProducts([]);
      setShowDropdown(false);
      setError(null);
    }
  }, [searchQuery, fetchProducts]);

  function handleSelectProduct(product: ProductRowData) {
    const next = [...selectedProducts, product];
    setSelectedProducts(next);
    onProductsChange(next.map((p) => p.id));
    setSearchQuery('');
    setShowDropdown(false);
  }

  function handleRemoveProduct(id: string) {
    const next = selectedProducts.filter((p) => p.id !== id);
    setSelectedProducts(next);
    onProductsChange(next.map((p) => p.id));
  }

  return (
    <div className={styles.formGroup}>
      <label htmlFor="collection-products-search">Productos en esta colección</label>

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
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ddd', borderRadius: '4px', maxHeight: '300px', overflowY: 'auto', zIndex: 10, marginTop: '4px' }}>
            {loading && <div style={{ padding: '8px' }}>Cargando...</div>}
            {error && <div style={{ padding: '8px', color: 'red', fontSize: '12px' }}>{error}</div>}
            {!loading && availableProducts.length === 0 && searchQuery && (
              <div style={{ padding: '8px', fontSize: '12px', color: '#666' }}>No hay productos disponibles</div>
            )}
            {availableProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelectProduct(product)}
                style={{ width: '100%', background: 'white', border: 'none', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
              >
                <ProductRow product={product} />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedProducts.length > 0 ? (
        <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ background: '#f5f5f5', padding: '8px 12px', fontSize: '12px', fontWeight: 600, color: '#666' }}>
            {selectedProducts.length} producto(s) seleccionado(s)
          </div>
          {selectedProducts.map((product) => (
            <ProductRow key={product.id} product={product} onRemove={handleRemoveProduct} />
          ))}
        </div>
      ) : (
        <div style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', color: '#999', fontSize: '14px', textAlign: 'center' }}>
          Sin productos asignados
        </div>
      )}

      <small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
        Buscá y agregá productos a esta colección. Los cambios se guardarán al hacer click en "Crear" o "Actualizar".
      </small>
    </div>
  );
};