import React, { useState, useEffect } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { Search } from 'lucide-react';
import type { AdminProduct } from '../../../../context/AdminProductsContext';
import { EmptyState } from '../../../../components/ui/EmptyState';
import styles from '../AdminVariants.module.css';

interface ProductSelectorProps {
  products: AdminProduct[];
  selectedProductId: string | null;
  onSelectProduct: (productId: string) => void;
  variants: Array<{ name: string; values: string[] }>;
}

/**
 * ProductSelector - Componente para seleccionar productos en el panel de variantes.
 *
 * Responsabilidades:
 * - Mostrar lista de productos con búsqueda y paginación.
 * - Manejar selección de producto.
 * - Mostrar conteo de variantes por producto.
 */
export const ProductSelector: React.FC<ProductSelectorProps> = ({
  products,
  selectedProductId,
  onSelectProduct,
  variants,
}) => {
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

  // Filtrar productos por búsqueda
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Resetear página al cambiar búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filtered.length / productsPerPage);
  const paginatedProducts = filtered.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  // Opciones para autocompletado
  type ProductOption = {
    type: 'product';
    id: string;
    name: string;
    sku: string;
  };
  type VariantOption = {
    type: 'variant';
    group: string;
    value: string;
    productId: string | null;
    sku: string;
  };
  type Option = ProductOption | VariantOption;

  const combinedOptions: (Option | string)[] = [
    ...products.map(p => ({
      type: 'product' as const,
      id: p.id,
      name: p.name,
      sku: p.sku || '',
    })),
    ...variants.flatMap(v => v.values.map(val => ({
      type: 'variant' as const,
      group: v.name,
      value: val,
      productId: selectedProductId ?? null,
      sku: '',
    }))),
  ];

  const filteredOptions = combinedOptions.filter(opt => {
    const q = inputValue.toLowerCase();
    if (typeof opt === 'string') {
      return opt.toLowerCase().includes(q);
    }
    if (opt.type === 'product') {
      return (
        opt.name.toLowerCase().includes(q) ||
        opt.sku.toLowerCase().includes(q)
      );
    } else {
      return (
        opt.value.toLowerCase().includes(q) ||
        (opt.group?.toLowerCase().includes(q) ?? false)
      );
    }
  });

  const handleSelect = (_evt: React.SyntheticEvent, value: string | Option | null) => {
    if (!value) return;
    if (typeof value === 'string') {
      setSearch(value);
    } else if (value.type === 'product') {
      setSearch(value.name);
      onSelectProduct(value.id);
    } else if (value.type === 'variant' && value.productId) {
      setSearch(value.value);
      onSelectProduct(value.productId);
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarTitle}>Productos</span>
        <span className={styles.productCount}>{filtered.length}</span>
      </div>

      <div style={{ padding: 'var(--space-3) var(--space-3)' }}>
        <Autocomplete
          freeSolo
          options={filteredOptions}
          getOptionLabel={(opt: string | Option) => {
            if (typeof opt === 'string') return opt;
            if (opt.type === 'product') return `${opt.name} (SKU: ${opt.sku})`;
            return `${opt.value} [${opt.group}]`;
          }}
          inputValue={inputValue}
          onInputChange={(_evt: React.SyntheticEvent, value: string) => setInputValue(value)}
          onChange={handleSelect}
          renderInput={(params: object) => (
            <TextField {...params} label="Buscar por nombre o SKU..." variant="outlined" size="small" />
          )}
        />
      </div>
      <ul className={styles.productList} style={{ paddingInline: 'var(--space-2) var(--space-2)' }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={32} />}
            title="Sin resultados"
            description="No se encontraron productos con esos términos."
          />
        ) : paginatedProducts.map(p => {
          const groupCount = selectedProductId === p.id ? variants.length : 0;
          const valueCount = selectedProductId === p.id
            ? variants.reduce((s, g) => s + g.values.length, 0)
            : 0;
          return (
            <button
              key={p.id}
              className={`${styles.productItem} ${selectedProductId === p.id ? styles.selected : ''}`}
              onClick={() => onSelectProduct(p.id)}
              type="button"
              style={{ textAlign: 'left', cursor: 'pointer', width: '100%' }}
            >
              <div className={styles.productName}>{p.name}</div>
              {p.sku && <div className={styles.productSku}>{p.sku}</div>}
              <div className={styles.productMeta}>
                {selectedProductId === p.id ? (
                  groupCount === 0
                    ? <span className={styles.noVariants}>Sin variantes</span>
                    : <span className={styles.variantBadge}>{groupCount} grupo{groupCount !== 1 ? 's' : ''} · {valueCount} valor{valueCount !== 1 ? 'es' : ''}</span>
                ) : (
                  <span className={styles.noVariants}>Seleccioná para ver</span>
                )}
              </div>
            </button>
          );
        })}
      </ul>

      {totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Paginación de productos">
          <button
            className={styles.pageBtn}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            title="Página anterior"
          >⟨</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.activePage : ''}`}
              onClick={() => setCurrentPage(i + 1)}
              title={`Ir a página ${i + 1}`}
            >{i + 1}</button>
          ))}
          <button
            className={styles.pageBtn}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            title="Página siguiente"
          >⟩</button>
        </nav>
      )}
    </aside>
  );
};