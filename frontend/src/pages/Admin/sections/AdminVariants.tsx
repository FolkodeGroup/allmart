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
    // Estado de carga manual (usa el de contexto)
    // Si quieres forzar skeletons, cambia el valor de isLoading en el contexto o usa una variable local diferente.
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
      // Estado para modal de edición masiva
      const [showBulkEdit, setShowBulkEdit] = useState(false);
      const [bulkEditName, setBulkEditName] = useState('');
      const [bulkEditValues, setBulkEditValues] = useState('');
      const [bulkEditStatus, setBulkEditStatus] = useState('');
      const handleOpenBulkEdit = () => setShowBulkEdit(true);
      const handleCloseBulkEdit = () => {
        setShowBulkEdit(false);
        setBulkEditName('');
        setBulkEditValues('');
        setBulkEditStatus('');
      };
      const handleBulkEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProductId || selectedGroups.length === 0) {
          toast.error('No hay grupos seleccionados');
          return;
        }
        const confirm = window.confirm(`¿Estás seguro de aplicar los cambios a ${selectedGroups.length} variantes? Esta acción no se puede deshacer.`);
        if (!confirm) return;
        try {
          // Preparar datos
          const valuesArr = bulkEditValues
            ? bulkEditValues.split(',').map(v => v.trim()).filter(Boolean)
            : undefined;
          // Actualizar cada grupo seleccionado
          await Promise.all(selectedGroups.map(async groupId => {
            await updateVariant(selectedProductId, groupId, {
              name: bulkEditName || undefined,
              values: valuesArr,
              // Estado: si el backend lo soporta, agregar aquí
            });
          }));
          setShowBulkEdit(false);
          setBulkEditName('');
          setBulkEditValues('');
          setBulkEditStatus('');
          setSelectedGroups([]);
          toast.success('¡Edición masiva aplicada con éxito!');
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error desconocido';
          toast.error(`Error en edición masiva: ${message}`);
        }
      };

  // Edición inline del nombre de grupo
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [editGroupError, setEditGroupError] = useState('');

  // Selección múltiple de grupos
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const handleSelectGroup = (groupId: string, checked: boolean) => {
    setSelectedGroups(prev =>
      checked ? [...prev, groupId] : prev.filter(id => id !== groupId)
    );
  };

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
      toast.error(`Error al cargar variantes: ${message}`);
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
      await addVariant(selectedProductId, name);
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
      if (selectedProductId) {
        deleteVariant(selectedProductId, groupId);
        toast.success(`Grupo "${groupName}" eliminado con éxito`);
      }
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
    const exists = variants.some(g => g.id !== variantId && g.name.toLowerCase() === name.toLowerCase());
    if (exists) return setEditGroupError('Ya existe otro grupo con ese nombre');
    try {
      if (selectedProductId) {
        await updateVariant(selectedProductId, variantId, { name });
        toast.success('Nombre actualizado con éxito');
      }
      setEditingGroupId(null);
      setEditingGroupName('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al actualizar: ${message}`);
    }
  };

  const addValue = (groupId: string) => {
    const val = (newValues[groupId] ?? '').trim();
    if (!val) return;
    try {
      if (selectedProductId) {
        addValueToVariant(selectedProductId, groupId, val);
        toast.success(`Valor "${val}" agregado con éxito`);
        setNewValues(prev => ({ ...prev, [groupId]: '' }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al agregar valor: ${message}`);
    }
  };

  const removeValue = (groupId: string, value: string) => {
    try {
      if (selectedProductId) {
        removeValueFromVariant(selectedProductId, groupId, value);
        toast.success(`Valor "${value}" eliminado con éxito`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al eliminar: ${message}`);
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className={sectionStyles.page} role="main" aria-label="Gestión de variantes">
      <div className={sectionStyles.header}>
        <span className={sectionStyles.label}>Administración</span>
        <h1 className={sectionStyles.title} tabIndex={0} aria-label="Variantes, administración de grupos y valores">
          <span role="img" aria-label="Paleta de colores">🎨</span> Variantes
        </h1>
        <p className={sectionStyles.subtitle}>
          Definí grupos de variantes por producto (ej: Color, Tamaño) y gestioná sus valores.
        </p>
      </div>

      <div className={styles.layout}>
        {/* ── Panel izquierdo: selector de producto ── */}
        <aside className={styles.sidebar} aria-label="Selector de productos">
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
          <ul className={styles.productList} role="listbox" aria-label="Lista de productos">
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
                  role="option"
                  aria-selected={selectedProductId === p.id}
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleSelectProduct(p.id)}
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
        <main className={styles.content} aria-label="Panel de gestión de variantes">
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
                      {/* Botón para edición masiva */}
                      {selectedGroups.length > 0 && (
                        <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
                          <button
                            className={styles.bulkEditBtn}
                            type="button"
                            onClick={handleOpenBulkEdit}
                            aria-label={`Editar ${selectedGroups.length} variantes seleccionadas`}
                          >
                            <span aria-hidden="true">✏️</span> Editar seleccionados ({selectedGroups.length})
                          </button>
                        </div>
                      )}
                      {/* Modal de edición masiva */}
                      {showBulkEdit && (
                        <div className={styles.bulkEditModalOverlay} role="dialog" aria-modal="true" aria-label="Edición masiva de variantes">
                          <div className={styles.bulkEditModal}>
                            <h3 tabIndex={0}>Edición masiva de variantes</h3>
                            <form onSubmit={handleBulkEditSubmit}>
                              <div className={styles.bulkEditField}>
                                <label htmlFor="bulk-edit-name">Nombre (opcional):</label>
                                <input
                                  id="bulk-edit-name"
                                  type="text"
                                  value={bulkEditName}
                                  onChange={e => setBulkEditName(e.target.value)}
                                  placeholder="Nuevo nombre para todos"
                                />
                              </div>
                              <div className={styles.bulkEditField}>
                                <label htmlFor="bulk-edit-values">Valores (separados por coma):</label>
                                <input
                                  id="bulk-edit-values"
                                  type="text"
                                  value={bulkEditValues}
                                  onChange={e => setBulkEditValues(e.target.value)}
                                  placeholder="Ej: Rojo, Verde, Azul"
                                />
                              </div>
                              <div className={styles.bulkEditField}>
                                <label htmlFor="bulk-edit-status">Estado (opcional):</label>
                                <input
                                  id="bulk-edit-status"
                                  type="text"
                                  value={bulkEditStatus}
                                  onChange={e => setBulkEditStatus(e.target.value)}
                                  placeholder="Activo/Inactivo"
                                />
                              </div>
                              <div className={styles.bulkEditActions}>
                                <button type="submit" className={styles.bulkEditApplyBtn} aria-label="Aplicar cambios masivos">Aplicar cambios</button>
                                <button type="button" className={styles.bulkEditCancelBtn} onClick={handleCloseBulkEdit} aria-label="Cancelar edición masiva">Cancelar</button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
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
                <div className={styles.groupsGrid} role="list" aria-label="Grupos de variantes">
                  {variants.map(group => (
                    <div key={group.id} className={styles.groupCard}>
                      {/* Imagen del producto */}
                      <div className={styles.groupImageWrapper} style={{marginBottom: '8px'}}>
                        {selectedProduct && selectedProduct.images && selectedProduct.images.length > 0 ? (
                          <picture>
                            <source srcSet={selectedProduct.images[0].replace(/\.(jpg|png)$/i, '.webp')} type="image/webp" />
                            <img
                              src={selectedProduct.images[0]}
                              alt={`Imagen principal de ${selectedProduct.name}`}
                              loading="lazy"
                              className={styles.groupImage}
                              style={{width: '100%', maxWidth: '120px', borderRadius: '8px', objectFit: 'cover', background: '#eee'}}
                            />
                          </picture>
                        ) : (
                          <div className={styles.groupImagePlaceholder} style={{width: '100%', maxWidth: '120px', height: '80px', borderRadius: '8px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '1.5rem'}}>
                            <span aria-label="Sin imagen" role="img">🖼️</span>
                          </div>
                        )}
                      </div>
                      {/* Header del grupo */}
                      <div className={styles.groupHeader}>
                        {/* Checkbox para selección múltiple */}
                        <input
                          type="checkbox"
                          checked={selectedGroups.includes(group.id)}
                          onChange={e => handleSelectGroup(group.id, e.target.checked)}
                          className={styles.groupCheckbox}
                          title="Seleccionar para edición masiva"
                          aria-label={`Seleccionar grupo ${group.name} para edición masiva`}
                        />
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
                            aria-label={can('variants.edit') ? `Editar nombre del grupo ${group.name}` : undefined}
                          >
                            {group.name}
                            {can('variants.edit') && <span className={styles.editHint} aria-hidden="true">✏️</span>}
                          </button>
                        )}
                        {can('variants.delete') && (
                          <button
                            className={styles.deleteGroupBtn}
                            onClick={() => deleteGroup(group.id)}
                            type="button"
                            title="Eliminar grupo"
                            aria-label={`Eliminar grupo ${group.name}`}
                          >
                            <span aria-hidden="true">🗑️</span>
                          </button>
                        )}
                      </div>
                      {/* Valores / chips */}
                      <div className={styles.valuesContainer}>
                        {group.values.length === 0 && (
                          <span className={styles.noValues}>Sin valores aún</span>
                        )}
                        {group.values.map(val => (
                          <span key={val} className={styles.valueChip} aria-label={`Valor ${val}`} tabIndex={0}>
                            {val}
                            {can('variants.delete') && (
                              <button
                                type="button"
                                className={styles.chipRemove}
                                onClick={() => removeValue(group.id, val)}
                                title={`Eliminar valor ${val}`}
                                aria-label={`Eliminar valor ${val}`}
                              >
                                <span aria-hidden="true">×</span>
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
                              aria-label={`Agregar valor a ${group.name}`}
                            />
                            <button
                              className={styles.addValueBtn}
                              type="button"
                              onClick={() => addValue(group.id)}
                              aria-label={`Agregar valor a ${group.name}`}
                            >
                              <span aria-hidden="true">＋</span>
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
