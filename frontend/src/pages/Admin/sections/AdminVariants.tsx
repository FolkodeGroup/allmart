import { useState } from 'react';
import { Palette, Box, Search, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdminProduct } from '../../../context/AdminProductsContext';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import { useAdminVariants } from '../../../context/AdminVariantsContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import sectionStyles from './AdminSection.module.css';
import styles from './AdminVariants.module.css';

export function AdminVariants() {
  const { products } = useAdminProducts();
  const {
    variants,
    selectedProductId,
    isLoading,
    error: apiError,
    loadVariants,
    addVariant,
    updateVariant,
    deleteVariant,
    addValueToVariant,
    removeValueFromVariant,
  } = useAdminVariants();
  const { can } = useAdminAuth();

  const [search, setSearch] = useState('');
  // Inputs de nuevo grupo y nuevos valores por grupo
  const [newGroupName, setNewGroupName] = useState('');
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Edición inline del nombre de grupo
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [editGroupError, setEditGroupError] = useState('');

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedProduct: AdminProduct | undefined = selectedProductId
    ? products.find(p => p.id === selectedProductId)
    : undefined;

  // ── Selección de producto ──────────────────────────────────────────
  const handleSelectProduct = async (productId: string) => {
    try {
      if (productId === selectedProductId) return;
      setNewGroupName('');
    setNewValues({});
    setErrors({});
    setEditingGroupId(null);
    setEditGroupError('');
    await loadVariants(productId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al guardar variantes: ${message}`);
    }
  };

  // ── CRUD de grupos ────────────────────────────────────────────────
  const addGroup = async () => {
    const name = newGroupName.trim();
    setErrors(prev => ({ ...prev, group: '' }));
    if (!selectedProductId) return;
    if (!name) return setErrors(prev => ({ ...prev, group: 'El nombre del grupo es obligatorio' }));
    
    const exists = variants.some(g => g.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      toast.error('Este grupo de variantes ya existe');
      return;
    }
    try {
      saveVariants([...variants, { id: `g-${Date.now()}`, name, values: [] }]);
      toast.success(`Grupo "${name}" creado con éxito`);
      setNewGroupName('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al crear grupo: ${message}`);
    }
  };

  const deleteGroup = (groupId: string) => {
    try {
      const groupName = variants.find(g => g.id === groupId)?.name;
      saveVariants(variants.filter(g => g.id !== groupId));
      toast.success(`Grupo "${groupName}" eliminado con éxito`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al eliminar: ${message}`);
    }
  };

  const startEditGroupName = (id: string, currentName: string) => {
    setEditingGroupId(id);
    setEditingGroupName(currentName);
    setEditGroupError('');
  };

  const commitEditGroupName = async (variantId: string) => {
    const name = editingGroupName.trim();
    setEditGroupError('');
    if (!name) return setEditGroupError('El nombre no puede estar vacío');
      try {
      
    const exists = variants.some(g => g.id !== variantId && g.name.toLowerCase() === name.toLowerCase());
    if (exists) return setEditGroupError('Ya existe otro grupo con ese nombre');

      if (selectedProductId) {
        try {
          await updateVariant(selectedProductId, variantId, { name });
          toast.success('Nombre actualizado con éxito');
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error desconocido';
          toast.error(`Error al actualizar: ${message}`);
        }
      }
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  const addValue = (groupId: string) => {
    const val = (newValues[groupId] ?? '').trim();
    if (!val) return;
    try {
      saveVariants(variants.map(g =>
        g.id === groupId && !g.values.includes(val)
          ? { ...g, values: [...g.values, val] }
          : g
      ));
      toast.success(`Valor "${val}" agregado con éxito`);
      setNewValues(prev => ({ ...prev, [groupId]: '' }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al agregar valor: ${message}`);
    }
  };

  const removeValue = (groupId: string, value: string) => {
    try {
      saveVariants(variants.map(g =>
        g.id === groupId ? { ...g, values: g.values.filter(v => v !== value) } : g
      ));
      toast.success(`Valor "${value}" eliminado con éxito`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al eliminar: ${message}`);
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className={sectionStyles.page}>
      <div className={sectionStyles.header}>
        <span className={sectionStyles.label}>Administración</span>
        <h1 className={sectionStyles.title}>
          <span>🎨</span> Variantes
        </h1>
        <p className={sectionStyles.subtitle}>
          Definí grupos de variantes por producto (ej: Color, Tamaño) y gestioná sus valores.
        </p>
      </div>

      <div className={styles.layout}>
        {/* ── Panel izquierdo: selector de producto ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>Productos</span>
            <span className={styles.productCount}>{filtered.length}</span>
          </div>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <ul className={styles.productList}>
            {filtered.length === 0 ? (
              <EmptyState 
                icon={<Search size={32} />}
                title="Sin resultados"
                description="No se encontraron productos con esos términos."
              />
            ) : filtered.map(p => {
              const groupCount = selectedProductId === p.id ? variants.length : 0;
              const valueCount = selectedProductId === p.id
                ? variants.reduce((s, g) => s + g.values.length, 0)
                : 0;
              return (
                <li
                  key={p.id}
                  className={`${styles.productItem} ${selectedProductId === p.id ? styles.selected : ''}`}
                  onClick={() => handleSelectProduct(p.id)}
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
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ── Panel derecho: gestión de variantes ── */}
        <main className={styles.content}>
          {isLoading ? (
            <div className={sectionStyles.loadingContainer}>
              <LoadingSpinner size="lg" message="Cargando variantes..." />
            </div>
          ) : !selectedProduct ? (
            <EmptyState
              icon={<Palette size={48} />}
              title="No hay producto seleccionado"
              description="Seleccioná un producto del panel izquierdo para gestionar sus variantes."
            />
          ) : (
            <>
              {apiError && (
                <div className={sectionStyles.errorState}>
                  <AlertCircle size={20} />
                  <p>Error: {apiError}</p>
                </div>
              )}
              <div className={styles.contentHeader}>
                <div>
                  <h2 className={styles.contentTitle}>{selectedProduct.name}</h2>
                  {selectedProduct.sku && (
                    <span className={styles.contentSku}>SKU: {selectedProduct.sku}</span>
                  )}
                </div>
                <span className={styles.groupCount}>
                  {variants.length} grupo{variants.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Formulario para nuevo grupo */}
              {can('variants.create') && (
                <div className={styles.addGroupSection}>
                  <div className={styles.addGroupRow}>
                    <input
                      className={`${styles.groupInput} ${errors.group ? styles.inputError : ''}`}
                      type="text"
                      placeholder="Nombre del grupo, ej: Color, Tamaño, Material..."
                      value={newGroupName}
                      onChange={e => {
                        setNewGroupName(e.target.value);
                        if (errors.group) setErrors(prev => ({ ...prev, group: '' }));
                      }}
                      onKeyDown={e => e.key === 'Enter' && addGroup()}
                    />
                    <button className={styles.addGroupBtn} onClick={addGroup} type="button">
                      + Agregar grupo
                    </button>
                  </div>
                  {errors.group && <span className={styles.errorText}>{errors.group}</span>}
                </div>
              )}

              {/* Sin variantes */}
              {variants.length === 0 ? (
                <EmptyState
                  icon={<Box size={40} />}
                  title="Sin variantes"
                  description="Este producto no tiene variantes aún. Podés crear el primer grupo arriba."
                />
              ) : (
                /* Lista de grupos */
                <div className={styles.groupsGrid}>
                  {variants.map(group => (
                    <div key={group.id} className={styles.groupCard}>
                      {/* Header del grupo */}
                      <div className={styles.groupHeader}>
                        {editingGroupId === group.id ? (
                          <div className={styles.editGroupNameWrapper}>
                            <input
                              className={`${styles.groupNameEdit} ${editGroupError ? styles.inputError : ''}`}
                              value={editingGroupName}
                              autoFocus
                              onChange={e => {
                                setEditingGroupName(e.target.value);
                                if (editGroupError) setEditGroupError('');
                              }}
                              onBlur={() => commitEditGroupName(group.id)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') commitEditGroupName(group.id);
                                if (e.key === 'Escape') {
                                  setEditingGroupId(null);
                                  setEditingGroupName('');
                                }
                              }}
                            />
                            {editGroupError && <div className={styles.errorText}>{editGroupError}</div>}
                          </div>
                        ) : (
                          <button
                            className={styles.groupName}
                            onClick={() => can('variants.edit') && startEditGroupName(group.id, group.name)}
                            type="button"
                            title={can('variants.edit') ? 'Hacé click para editar el nombre' : undefined}
                            style={can('variants.edit') ? undefined : { cursor: 'default' }}
                          >
                            {group.name}
                            {can('variants.edit') && <span className={styles.editHint}>✏️</span>}
                          </button>
                        )}
                        {can('variants.delete') && (
                          <button
                            className={styles.deleteGroupBtn}
                            onClick={() => deleteGroup(group.id)}
                            type="button"
                            title="Eliminar grupo"
                          >
                            🗑️
                          </button>
                        )}
                      </div>

                      {/* Valores / chips */}
                      <div className={styles.valuesContainer}>
                        {group.values.length === 0 && (
                          <span className={styles.noValues}>Sin valores aún</span>
                        )}
                        {group.values.map(val => (
                          <span key={val} className={styles.valueChip}>
                            {val}
                            {can('variants.delete') && (
                              <button
                                type="button"
                                className={styles.chipRemove}
                                onClick={() => removeValue(group.id, val)}
                                title={`Eliminar ${val}`}
                              >\
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>

                      {/* Input para agregar valor */}
                      {can('variants.edit') && (
                        <div className={styles.addValueSection}>
                          <div className={styles.addValueRow}>
                            <input
                              className={`${styles.valueInput} ${errors[`value-${group.id}`] ? styles.inputError : ''}`}
                              type="text"
                              placeholder={`Agregar valor a ${group.name}...`}
                              value={newValues[group.id] ?? ''}
                              onChange={e => {
                                setNewValues(prev => ({ ...prev, [group.id]: e.target.value }));
                                if (errors[`value-${group.id}`]) setErrors(prev => ({ ...prev, [`value-${group.id}`]: '' }));
                              }}
                              onKeyDown={e => e.key === 'Enter' && addValue(group.id)}
                            />
                            <button
                              className={styles.addValueBtn}
                              type="button"
                              onClick={() => addValue(group.id)}
                            >
                              ＋
                            </button>
                          </div>
                          {errors[`value-${group.id}`] && <span className={styles.errorText}>{errors[`value-${group.id}`]}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
