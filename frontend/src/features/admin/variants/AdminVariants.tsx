import { useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { Palette, Box, Search, AlertCircle } from 'lucide-react';
import type { AdminProduct } from '../../../context/AdminProductsContext';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import { useAdminVariants } from '../../../context/AdminVariantsContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import sectionStyles from '../shared/AdminSection.module.css';
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
    
    await addVariant(selectedProductId, name);
    setNewGroupName('');
  };

  const deleteGroup = async (variantId: string) => {
    if (!selectedProductId || !window.confirm('¿Eliminar este grupo y todos sus valores?')) return;
    await deleteVariant(selectedProductId, variantId);
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

    if (selectedProductId) {
      await updateVariant(selectedProductId, variantId, { name });
    }
    setEditingGroupId(null);
    setEditingGroupName('');
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
