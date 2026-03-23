import { useState, useEffect, useCallback } from 'react';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
// import { logAdminActivity } from '../../../services/adminActivityLogService';
// import { AdminCategoryForm } from './AdminCategoryForm'; // Temporalmente deshabilitado si no existe
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { FolderSearch, AlertCircle } from 'lucide-react';
import { CategoriesGrid } from './CategoriesGrid';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminCategories.module.css';
import { CategorySearchInput } from '../../../components/ui/CategorySearchInput';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

export function AdminCategories() {
  const { categories, isLoading: loading, error, refreshCategories, totalPages: apiTotalPages, total } = useAdminCategories();
  // Local state for pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Could be made configurable
  const { can } = useAdminAuth();
  const [search, setSearch] = useState('');
  // Para UX: si el usuario selecciona una sugerencia, forzar búsqueda exacta
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [, setEditId] = useState<string | null>(null);
  // const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);


  // Debounce para búsqueda instantánea

  // Debounce para búsqueda instantánea
  const debouncedSearch = useDebouncedValue(search, 350);

  // Fetch categories when page, limit, or search changes
  useEffect(() => {
    refreshCategories({ q: selectedSuggestion || debouncedSearch, page, limit });
    if (selectedSuggestion) setSelectedSuggestion(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedSuggestion, page, limit, refreshCategories]);

  // Reset page to 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);


  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleNew = () => { setEditId(null); setShowForm(true); };
  const handleEdit = (id: string) => { setEditId(id); setShowForm(true); };
  // const auth = useAdminAuth ? useAdminAuth() : null;
  // const userEmail = (auth && (auth.user as any)?.email) || 'desconocido';
  // const handleDelete = async (id: string) => {
  //   try {
  //     if (id) {
  //       await deleteCategory(id);
  //       logAdminActivity({
  //         timestamp: new Date().toISOString(),
  //         user: userEmail,
  //         action: 'delete',
  //         entity: 'category',
  //         entityId: id,
  //         details: {},
  //       });
  //     }
  //   } catch (err) {
  //     console.error('Error al eliminar categoría:', err);
  //   }
  //   setDeleteConfirm(null);
  // };

  return (
    <div className={`${sectionStyles.page} dark:bg-gray-900 dark:text-gray-100`}>
        {/* Header */}
        <div className={sectionStyles.header}>
          <div className={styles.headerTop}>
            <div>
              <span className={sectionStyles.label}>Administración</span>
              <h1 className={sectionStyles.title}>
                <span className={sectionStyles.icon}>📁</span> Categorías
              </h1>
              <p className={sectionStyles.subtitle}>
                Gestioná las categorías del catálogo para organizar tus productos.
              </p>
            </div>
            {can('categories.create') && (
              <button className={styles.newBtn} onClick={handleNew}>
                + Nueva categoría
              </button>
            )}
          </div>
        </div>

        {/* Filtros fuera del header */}
        <div className={styles.filters}>
          <CategorySearchInput
            categories={categories}
            value={search}
            onChange={setSearch}
            onSelectSuggestion={cat => {
              setSearch(cat.name);
              setSelectedSuggestion(cat.name);
            }}
            placeholder="Buscar por nombre o slug..."
          />
          <span className={styles.count}>{total} categorías</span>
        </div>

      {/* Tabla */}
      {loading && <LoadingSpinner message="Cargando categorías..." size="lg" />}

      {!loading && error && (
        <EmptyState
          icon={<AlertCircle size={48} color="#ef4444" />}
          title="Error al cargar categorías"
          description={error}
          action={{ label: 'Reintentar', onClick: () => window.location.reload() }}
        />
      )}

      {!loading && !error && (categories.length === 0 ? (
        <EmptyState
          icon={<FolderSearch size={48} color="#94a3b8" />}
          title="No se encontraron categorías"
          description={search
            ? "No hay resultados para tu búsqueda. Probá con otro término."
            : "Todavía no cargaste ninguna categoría al catálogo."
          }
          action={can('categories.create') ? { label: 'Nueva Categoría', onClick: handleNew } : undefined}
        />
      ) : (
        <CategoriesGrid
          categories={categories}
          onEdit={can('categories.edit') ? handleEdit : undefined}
          // onDelete={can('categories.delete') ? (id => setDeleteConfirm(id)) : undefined}
          canEdit={can('categories.edit')}
          canDelete={can('categories.delete')}
          getProductCount={cat => cat.itemCount}
        />
      ))}

      {/* Controles de paginación */}
      {total > limit && (
        <div className={styles.pagination} style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <button
            className={styles.pageBtn}
            disabled={page === 1 || loading}
            onClick={() => handlePageChange(page - 1)}
          >Anterior</button>
          {Array.from({ length: apiTotalPages }, (_, i) => (
            <button
              key={i + 1}
              className={styles.pageBtn + (page === i + 1 ? ' ' + styles.pageActive : '')}
              disabled={page === i + 1 || loading}
              onClick={() => handlePageChange(i + 1)}
            >{i + 1}</button>
          ))}
          <button
            className={styles.pageBtn}
            disabled={page === apiTotalPages || loading}
            onClick={() => handlePageChange(page + 1)}
          >Siguiente</button>
        </div>
      )}

      {/* Modal de formulario - Deshabilitado por falta de componente */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px' }}>
             <p>Componente Formulario no encontrado.</p>
             <button onClick={() => setShowForm(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
