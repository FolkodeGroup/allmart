import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, PackageSearch, AlertCircle } from 'lucide-react';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { ProductCardsGrid } from '../../../components/ui/ProductCardsGrid';
import { ProductPagination } from '../../../components/ui/ProductPagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { AdminProductCard } from '../products/AdminProductCard';
import sectionStyles from '../shared/AdminSection.module.css';

export function AdminCategoryProducts() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const {
    products,
    loading,
    error,
    refreshProducts,
    page: apiPage,
    totalPages,
    total,
  } = useAdminProducts();
  const { categories, refreshCategories } = useAdminCategories();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const category = useMemo(
    () => categories.find((item) => item.id === categoryId),
    [categories, categoryId]
  );

  useEffect(() => {
    if (!categoryId) return;

    if (!category) {
      refreshCategories({ page: 1, limit: 50 });
    }
  }, [categoryId, category, refreshCategories]);

  useEffect(() => {
    if (!categoryId) return;

    const timeoutId = window.setTimeout(() => {
      refreshProducts({
        categoryId,
        q: search.trim() || undefined,
        page: currentPage,
        limit: 12,
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [categoryId, search, currentPage, refreshProducts]);

  useEffect(() => {
    if (apiPage !== currentPage) {
      setCurrentPage(apiPage);
    }
  }, [apiPage, currentPage]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  if (!categoryId) {
    return (
      <div className={sectionStyles.page}>
        <EmptyState
          icon={<AlertCircle size={48} color="#ef4444" />}
          title="Categoría inválida"
          description="No se encontró el identificador de la categoría en la URL."
          action={{ label: 'Volver a categorías', onClick: () => navigate('/admin/categorias') }}
        />
      </div>
    );
  }

  return (
    <main className={sectionStyles.page}>
      <header className={sectionStyles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <button
              type="button"
              onClick={() => navigate('/admin/categorias')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                border: '1px solid #e5e2dd',
                borderRadius: 8,
                background: '#fff',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: 13,
                marginBottom: 10,
              }}
            >
              <ArrowLeft size={14} /> Volver a categorías
            </button>

            <span className={sectionStyles.label}>Administración</span>
            <h1 className={sectionStyles.title}>Productos de {category?.name ?? 'categoría'}</h1>
            <p className={sectionStyles.subtitle}>
              Gestioná y revisá los productos asignados a esta categoría.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/productos')}
            style={{
              border: 'none',
              borderRadius: 10,
              background: '#769282',
              color: '#fff',
              padding: '10px 14px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Ir al panel de productos
          </button>
        </div>
      </header>

      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 12,
          padding: 12,
          border: '1px solid #e5e2dd',
          borderRadius: 12,
          background: '#fafaf8',
          marginBottom: 16,
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setCurrentPage(1);
          }}
          placeholder="Buscar productos por nombre o SKU"
          style={{
            width: 'min(520px, 100%)',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            padding: '10px 12px',
            fontSize: 14,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4b5563', fontSize: 14 }}>
          <strong style={{ color: '#111827' }}>{total}</strong>
          <span>{total === 1 ? 'producto' : 'productos'} en esta categoría</span>
        </div>
      </section>

      {loading && <LoadingSpinner message="Cargando productos de la categoría..." size="lg" />}

      {!loading && error && (
        <EmptyState
          icon={<AlertCircle size={48} color="#ef4444" />}
          title="Error al cargar productos"
          description={error}
          action={{ label: 'Reintentar', onClick: () => refreshProducts({ categoryId, q: search.trim() || undefined, page: currentPage, limit: 12 }) }}
        />
      )}

      {!loading && !error && products.length === 0 && (
        <EmptyState
          icon={<PackageSearch size={48} color="#94a3b8" />}
          title="Sin productos en esta categoría"
          description={
            search
              ? 'No hay resultados para esa búsqueda dentro de la categoría.'
              : 'Esta categoría todavía no tiene productos asignados.'
          }
          action={{ label: 'Ir al panel de productos', onClick: () => navigate('/admin/productos') }}
        />
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <ProductCardsGrid>
            {products.map((product) => (
              <AdminProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                sku={product.sku}
                price={product.price}
                discount={product.discount}
                stock={product.stock}
                inStock={product.inStock}
                image={product.images?.[0]}
                category={product.category?.name || ''}
                canEdit={false}
                canDelete={false}
              />
            ))}
          </ProductCardsGrid>

          {totalPages > 1 && (
            <ProductPagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </main>
  );
}
