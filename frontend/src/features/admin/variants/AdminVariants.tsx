
import { useState, useEffect } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { Palette, Box, Search, AlertCircle, HelpCircle } from 'lucide-react';
import type { AdminProduct } from '../../../context/AdminProductsContext';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import { useAdminVariants } from '../../../context/AdminVariantsContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { logAdminActivity } from '../../../services/adminActivityLogService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminVariants.module.css';
import { ModalConfirm } from '../../../components/ui/ModalConfirm';
import { Notification } from '../../../components/ui/Notification';

export function AdminVariants() {
    // Estados para feedback UX
    const [notif, setNotif] = useState<{open:boolean,type:'success'|'error',message:string}>({open:false,type:'success',message:''});
    const [modalOpen, setModalOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string|null>(null);
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
  // Para autocompletado
  const [inputValue, setInputValue] = useState('');
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

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10; // Puedes ajustar este valor para más/menos productos por página
  const totalPages = Math.ceil(filtered.length / productsPerPage);
  // Mantener filtros y búsqueda al cambiar de página
  useEffect(() => {
    setCurrentPage(1); // Reinicia a la primera página si cambia el filtro
  }, [search]);
  const paginatedProducts = filtered.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  // Combina productos y variantes para autocompletado
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

  // Para freeSolo, las opciones pueden ser string u Option
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
    })))
  ];

  // Filtra opciones para autocompletado
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

  const selectedProduct: AdminProduct | undefined = selectedProductId
    ? products.find(p => p.id === selectedProductId)
    : undefined;

  // ── Selección de producto ──────────────────────────────────────────
  const handleSelectProduct = async (productId: string) => {
    if (productId === selectedProductId) return;
    setNewGroupName('');
    setNewValues({});
    setErrors({});
    setEditingGroupId(null);
    setEditGroupError('');
    await loadVariants(productId);
  };

  // ── CRUD de grupos ────────────────────────────────────────────────
  const addGroup = async () => {
    const name = newGroupName.trim();
    setErrors(prev => ({ ...prev, group: '' }));
    if (!selectedProductId) return;
    if (!name) return setErrors(prev => ({ ...prev, group: 'El nombre del grupo es obligatorio' }));
    const exists = variants.some(g => g.name.toLowerCase() === name.toLowerCase());
    if (exists) return setErrors(prev => ({ ...prev, group: 'Ya existe un grupo con ese nombre' }));
    try {
      await addVariant(selectedProductId, name);
      setNotif({open:true,type:'success',message:'Variante creada correctamente.'});
      setNewGroupName('');
    } catch {
      setNotif({open:true,type:'error',message:'Error al crear variante.'});
    }
  };

  const deleteGroup = async (variantId: string) => {
    if (!selectedProductId) return;
    setPendingDeleteId(variantId);
    setModalOpen(true);
  };

  const auth = useAdminAuth ? useAdminAuth() : null;
  const userEmail = (auth && (auth.user as any)?.email) || 'desconocido';
  const confirmDelete = async () => {
    if (!selectedProductId || !pendingDeleteId) return;
    setModalOpen(false);
    try {
      await deleteVariant(selectedProductId, pendingDeleteId);
      logAdminActivity({
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: 'delete',
        entity: 'variant',
        entityId: pendingDeleteId,
        details: { productId: selectedProductId },
      });
      setNotif({open:true,type:'success',message:'Variante eliminada correctamente.'});
    } catch {
      setNotif({open:true,type:'error',message:'Error al eliminar variante.'});
    }
    setPendingDeleteId(null);
  };

  const cancelDelete = () => {
    setModalOpen(false);
    setPendingDeleteId(null);
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
        setNotif({open:true,type:'success',message:'Variante editada correctamente.'});
      }
      setEditingGroupId(null);
      setEditingGroupName('');
    } catch {
      setNotif({open:true,type:'error',message:'Error al editar variante.'});
    }
  };

  // ── CRUD de valores ───────────────────────────────────────────────
  const addValue = async (variantId: string) => {
    const val = (newValues[variantId] ?? '').trim();
    setErrors(prev => ({ ...prev, [`value-${variantId}`]: '' }));
    if (!selectedProductId) return;
    if (!val) return setErrors(prev => ({ ...prev, [`value-${variantId}`]: 'El valor es obligatorio' }));

    const group = variants.find(v => v.id === variantId);
    if (group?.values.some(v => v.toLowerCase() === val.toLowerCase())) {
      return setErrors(prev => ({ ...prev, [`value-${variantId}`]: 'Este valor ya existe en el grupo' }));
    }

    await addValueToVariant(selectedProductId, variantId, val);
    setNewValues(prev => ({ ...prev, [variantId]: '' }));
  };

  const removeValue = async (variantId: string, value: string) => {
    if (!selectedProductId) return;
    await removeValueFromVariant(selectedProductId, variantId, value);
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className={sectionStyles.page}>
      <ModalConfirm
        open={modalOpen}
        title="¿Eliminar variante?"
        description="Esta acción no se puede deshacer. Se eliminarán todos los valores asociados."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      <Notification
        open={notif.open}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif(prev => ({...prev,open:false}))}
      />
      <div className={sectionStyles.header}>
        <span className={sectionStyles.label}>Administración</span>
        <h1 className={sectionStyles.title}>
          <span>🎨</span> Variantes
          <Tooltip
            title="Las variantes permiten definir atributos de productos como color, tamaño o material. Cada variante tiene un nombre (ej: 'Color') y valores asociados (ej: 'Rojo', 'Azul'). Los clientes pueden seleccionar combinaciones de variantes al comprar."
            placement="right"
            arrow
          >
            <HelpCircle size={20} className={styles.helpIcon} />
          </Tooltip>
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
          {/* Autocomplete de MUI */}
          <Autocomplete
            freeSolo
            options={filteredOptions}
            getOptionLabel={(opt: string | Option) => {
              if (typeof opt === 'string') return opt;
              if (opt.type === 'product') return `${opt.name} (SKU: ${opt.sku})`;
              return `${opt.value} [${opt.group}]`;
            }}
            inputValue={inputValue}
            onInputChange={(_: any, value: string) => setInputValue(value)}
            onChange={(_: any, value: string | Option | null) => {
              if (!value) return;
              if (typeof value === 'string') {
                setSearch(value);
              } else if (value.type === 'product') {
                setSearch(value.name);
                handleSelectProduct(value.id);
              } else if (value.type === 'variant' && value.productId) {
                setSearch(value.value);
                handleSelectProduct(value.productId);
              }
            }}
            renderInput={(params: any) => (
              <TextField {...params} label="Buscar por nombre o SKU..." variant="outlined" size="small" />
            )}
          />
          <ul className={styles.productList}>
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
          {/* Paginación visualmente atractiva */}
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
                  key={i+1}
                  className={`${styles.pageBtn} ${currentPage === i+1 ? styles.activePage : ''}`}
                  onClick={() => setCurrentPage(i+1)}
                  title={`Ir a página ${i+1}`}
                >{i+1}</button>
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
                    <Tooltip title="Crear un nuevo grupo de variantes para este producto (ej: Color, Tamaño, Material)" placement="top" arrow>
                      <button className={styles.addGroupBtn} onClick={addGroup} type="button">
                        + Agregar grupo
                      </button>
                    </Tooltip>
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
                          <Tooltip title={can('variants.edit') ? 'Hacer clic para editar el nombre del grupo de variantes' : 'No tienes permisos para editar'} placement="top" arrow>
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
                          </Tooltip>
                        )}
                        {can('variants.delete') && (
                          <Tooltip title="Eliminar este grupo de variantes y todos sus valores asociados" placement="top" arrow>
                            <button
                              className={styles.deleteGroupBtn}
                              onClick={() => deleteGroup(group.id)}
                              type="button"
                              title="Eliminar grupo"
                            >
                              🗑️
                            </button>
                          </Tooltip>
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
                              <Tooltip title={`Eliminar el valor "${val}" de este grupo`} placement="top" arrow>
                                <button
                                  type="button"
                                  className={styles.chipRemove}
                                  onClick={() => removeValue(group.id, val)}
                                  title={`Eliminar ${val}`}
                                >
                                  ×
                                </button>
                              </Tooltip>
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
                            <Tooltip title={`Agregar un nuevo valor al grupo "${group.name}"`} placement="top" arrow>
                              <button
                                className={styles.addValueBtn}
                                type="button"
                                onClick={() => addValue(group.id)}
                              >
                                ＋
                              </button>
                            </Tooltip>
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
