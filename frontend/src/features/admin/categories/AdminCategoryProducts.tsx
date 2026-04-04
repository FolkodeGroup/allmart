import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, PackageSearch, AlertCircle } from 'lucide-react';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useNotification } from '../../../context/NotificationContext';
import { ProductCardsGrid } from '../../../components/ui/ProductCardsGrid';
import { ProductPagination } from '../../../components/ui/ProductPagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { AdminProductCard } from '../products/AdminProductCard';
import sectionStyles from '../shared/AdminSection.module.css';

export function AdminCategoryProducts() {
  const navigate = useNavigate();
  const { categoryId: categoryParam } = useParams();
  const {
    products,
    loading,
    error,
    refreshProducts,
    updateProduct,
    page: apiPage,
    totalPages,
    total,
  } = useAdminProducts();
  const { categories, refreshCategories } = useAdminCategories();
  const { showNotification } = useNotification();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [campaignTag, setCampaignTag] = useState('');
  const [priceDeltaPercent, setPriceDeltaPercent] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const category = useMemo(() => {
    if (!categoryParam) return undefined;
    return categories.find(
      (item) =>
        item.id === categoryParam ||
        item.slug?.toLowerCase() === categoryParam.toLowerCase()
    );
  }, [categories, categoryParam]);

  const categoryId = category?.id;

  useEffect(() => {
    if (!categoryParam) return;

    if (!category) {
      refreshCategories({ page: 1, limit: 50 });
    }
  }, [categoryParam, category, refreshCategories]);

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

  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, search, categoryParam]);

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedIds.includes(product.id)),
    [products, selectedIds]
  );

  const allVisibleSelected = products.length > 0 && products.every((product) => selectedIds.includes(product.id));
  const lowStockCount = useMemo(
    () => products.filter((product) => product.stock <= 3).length,
    [products]
  );
  const featuredCount = useMemo(
    () => products.filter((product) => !!product.isFeatured).length,
    [products]
  );

  const refreshCurrentCategoryProducts = useCallback(async () => {
    if (!categoryId) return;

    await refreshProducts({
      categoryId,
      q: search.trim() || undefined,
      page: currentPage,
      limit: 12,
    });
  }, [categoryId, search, currentPage, refreshProducts]);

  const handleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedIds(products.map((product) => product.id));
      return;
    }
    setSelectedIds([]);
  };

  const handleSelectProduct = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, id]));
      return prev.filter((item) => item !== id);
    });
  };

  const runBulkUpdate = useCallback(async (
    updater: (product: (typeof products)[number]) => Record<string, unknown>,
    successMessage: string
  ) => {
    if (selectedProducts.length === 0) {
      showNotification('info', 'Seleccioná al menos un producto para aplicar la acción.');
      return;
    }

    setBulkLoading(true);
    try {
      await Promise.all(
        selectedProducts.map((product) =>
          updateProduct(product.id, updater(product))
        )
      );
      showNotification('success', successMessage);
      setSelectedIds([]);
      await refreshCurrentCategoryProducts();
    } catch (err: any) {
      showNotification('error', err?.message || 'No se pudo aplicar la acción masiva.');
    } finally {
      setBulkLoading(false);
    }
  }, [selectedProducts, showNotification, updateProduct, refreshCurrentCategoryProducts]);

  const handleAddCampaignTag = async () => {
    const tag = campaignTag.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag) {
      showNotification('info', 'Ingresá una etiqueta de campaña válida.');
      return;
    }

    await runBulkUpdate((product) => {
      const tags = Array.isArray(product.tags) ? product.tags : [];
      if (tags.includes(tag)) return { tags };
      return { tags: [...tags, tag] };
    }, `Etiqueta "${tag}" aplicada correctamente.`);
  };

  const handleRemoveCampaignTag = async () => {
    const tag = campaignTag.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag) {
      showNotification('info', 'Ingresá la etiqueta que querés quitar.');
      return;
    }

    await runBulkUpdate((product) => {
      const tags = Array.isArray(product.tags) ? product.tags : [];
      return { tags: tags.filter((item) => item !== tag) };
    }, `Etiqueta "${tag}" removida correctamente.`);
  };

  const handleAdjustPricesByPercent = async () => {
    const delta = Number(priceDeltaPercent);
    if (!Number.isFinite(delta) || delta === 0) {
      showNotification('info', 'Ingresá un porcentaje válido distinto de 0.');
      return;
    }

    await runBulkUpdate((product) => {
      const updatedPrice = Number((product.price * (1 + delta / 100)).toFixed(2));
      return { price: updatedPrice };
    }, `Precios actualizados en ${delta > 0 ? '+' : ''}${delta}% para la selección.`);
    setPriceDeltaPercent('');
  };

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  if (!categoryParam) {
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

            <h1 className={sectionStyles.title}>Productos de {category?.name ?? 'categoría'}</h1>
            <p className={sectionStyles.subtitle}>
              {category
                ? `Gestioná y revisá los productos asignados a ${category.name}.`
                : 'Gestioná y revisá los productos asignados a esta categoría.'}
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

      <section
        style={{
          border: '1px solid #d8e4dd',
          background: 'linear-gradient(135deg, #f8fcf9 0%, #f2f8f5 100%)',
          borderRadius: 14,
          padding: 14,
          marginBottom: 16,
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1f2937' }}>Merchandising premium de categoría</h2>
            <p style={{ margin: '4px 0 0', color: '#4b5563', fontSize: 13 }}>
              Acciones exclusivas para esta categoría: destacados, campañas por tags y ajuste dinámico de precios.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
            <span style={{ background: '#e9f7ef', color: '#1f6f43', borderRadius: 999, padding: '6px 10px', fontWeight: 600 }}>
              {featuredCount} destacados
            </span>
            <span style={{ background: '#fff4e5', color: '#92400e', borderRadius: 999, padding: '6px 10px', fontWeight: 600 }}>
              {lowStockCount} stock critico
            </span>
            <span style={{ background: '#e5edff', color: '#1e3a8a', borderRadius: 999, padding: '6px 10px', fontWeight: 600 }}>
              {selectedIds.length} seleccionados
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#374151' }}>
            <input type="checkbox" checked={allVisibleSelected} onChange={(event) => handleSelectAllVisible(event.target.checked)} />
            Seleccionar todos visibles
          </label>

          <button
            type="button"
            disabled={bulkLoading || selectedIds.length === 0}
            onClick={() => runBulkUpdate(() => ({ isFeatured: true }), 'Productos destacados correctamente.')}
            style={{ border: 'none', borderRadius: 8, padding: '8px 12px', background: '#0f766e', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          >
            Destacar selección
          </button>

          <button
            type="button"
            disabled={bulkLoading || selectedIds.length === 0}
            onClick={() => runBulkUpdate(() => ({ isFeatured: false }), 'Destacado removido de la selección.')}
            style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', background: '#fff', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
          >
            Quitar destacado
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Etiqueta de campaña (ej: winter-drop)"
            value={campaignTag}
            onChange={(event) => setCampaignTag(event.target.value)}
            disabled={bulkLoading}
            style={{ minWidth: 260, borderRadius: 8, border: '1px solid #d1d5db', padding: '8px 10px' }}
          />
          <button
            type="button"
            disabled={bulkLoading || selectedIds.length === 0}
            onClick={handleAddCampaignTag}
            style={{ border: 'none', borderRadius: 8, padding: '8px 12px', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          >
            Agregar tag
          </button>
          <button
            type="button"
            disabled={bulkLoading || selectedIds.length === 0}
            onClick={handleRemoveCampaignTag}
            style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', background: '#fff', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
          >
            Quitar tag
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="number"
            step="0.1"
            placeholder="Ajuste % (ej: 5 o -10)"
            value={priceDeltaPercent}
            onChange={(event) => setPriceDeltaPercent(event.target.value)}
            disabled={bulkLoading}
            style={{ minWidth: 220, borderRadius: 8, border: '1px solid #d1d5db', padding: '8px 10px' }}
          />
          <button
            type="button"
            disabled={bulkLoading || selectedIds.length === 0}
            onClick={handleAdjustPricesByPercent}
            style={{ border: 'none', borderRadius: 8, padding: '8px 12px', background: '#0f766e', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          >
            Aplicar ajuste de precio
          </button>
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
                showCheckbox
                selected={selectedIds.includes(product.id)}
                onSelectChange={handleSelectProduct}
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
