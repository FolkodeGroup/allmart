import { useState, useEffect } from 'react';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { logAdminActivity } from '../../../services/adminActivityLogService';
// import { AdminCategoryForm } from './AdminCategoryForm'; // Temporalmente deshabilitado si no existe
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { FolderSearch, AlertCircle } from 'lucide-react';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminCategories.module.css';

export function AdminCategories() {
  const { categories, deleteCategory, isLoading: loading, error, refreshCategories, page: apiPage, totalPages: apiTotalPages, total } = useAdminCategories();
  const { can } = useAdminAuth();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshCategories({ q: search, page: 1, limit: 10 });
    }, 400);
    return () => clearTimeout(timer);
  }, [search, refreshCategories]);

  const handlePageChange = (newPage: number) => {
    refreshCategories({ q: search, page: newPage, limit: 10 });
  };

  const handleNew = () => { setEditId(null); setShowForm(true); };
  const handleEdit = (id: string) => { setEditId(id); setShowForm(true); };
  const auth = useAdminAuth ? useAdminAuth() : null;
  const userEmail = (auth && (auth.user as any)?.email) || 'desconocido';
  const handleDelete = async (id: string) => {
    try {
      if (id) {
        await deleteCategory(id);
        logAdminActivity({
          timestamp: new Date().toISOString(),
          user: userEmail,
          action: 'delete',
          entity: 'category',
          entityId: id,
          details: {},
        });
      }
    } catch (err) {
      console.error('Error al eliminar categoría:', err);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className={sectionStyles.page}>
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

        {/* Filtros */}
        <div className={styles.filters}>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className={styles.count}>{total} categorías</span>
        </div>
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
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Nombre</th>
                <th className={styles.th}>Identificador</th>
                <th className={styles.th}>Slug</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id} className={styles.row}>
                  <td className={styles.td}>
                    <div className={styles.categoryName}>{c.name}</div>
                  </td>
                  <td className={styles.td}>
                    <code>{c.id}</code>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.slugBadge}>{c.slug}</span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      {can('categories.edit') && (
                        <button
                          className={styles.editBtn}
                          onClick={() => handleEdit(c.id)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                      )}
                      {can('categories.delete') && (
                        deleteConfirm === c.id ? (
                          <>
                            <button className={styles.confirmDeleteBtn} onClick={() => handleDelete(c.id)}>
                              Confirmar
                            </button>
                            <button className={styles.cancelDeleteBtn} onClick={() => setDeleteConfirm(null)}>
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            className={styles.deleteBtn}
                            onClick={() => setDeleteConfirm(c.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Controles de paginación */}
      {total > 10 && (
        <div className={styles.pagination} style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <button
            className={styles.pageBtn}
            disabled={apiPage === 1}
            onClick={() => handlePageChange(apiPage - 1)}
          >Anterior</button>
          {Array.from({ length: apiTotalPages }, (_, i) => (
            <button
              key={i + 1}
              className={styles.pageBtn + (apiPage === i + 1 ? ' ' + styles.pageActive : '')}
              onClick={() => handlePageChange(i + 1)}
            >{i + 1}</button>
          ))}
          <button
            className={styles.pageBtn}
            disabled={apiPage === apiTotalPages}
            onClick={() => handlePageChange(apiPage + 1)}
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
