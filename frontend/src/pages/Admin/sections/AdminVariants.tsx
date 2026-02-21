import { useState } from 'react';
import type { VariantGroup, AdminProduct } from '../../../context/AdminProductsContext';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import sectionStyles from './AdminSection.module.css';
import styles from './AdminVariants.module.css';

export function AdminVariants() {
  const { products, updateProduct } = useAdminProducts();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Estado para inputs de nuevo grupo y nuevos valores por grupo
  const [newGroupName, setNewGroupName] = useState('');
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  // Estado para edición inline del nombre de grupo
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedProduct: AdminProduct | undefined = selectedId
    ? products.find(p => p.id === selectedId)
    : undefined;

  const variants: VariantGroup[] = selectedProduct?.variants ?? [];

  // ── Helpers ──────────────────────────────────────────────────────
  const saveVariants = (groups: VariantGroup[]) => {
    if (!selectedId) return;
    updateProduct(selectedId, { variants: groups });
  };

  const addGroup = () => {
    const name = newGroupName.trim();
    if (!name || !selectedId) return;
    const exists = variants.some(g => g.name.toLowerCase() === name.toLowerCase());
    if (exists) return;
    saveVariants([...variants, { id: `g-${Date.now()}`, name, values: [] }]);
    setNewGroupName('');
  };

  const deleteGroup = (groupId: string) => {
    saveVariants(variants.filter(g => g.id !== groupId));
  };

  const startEditGroupName = (group: VariantGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const commitEditGroupName = (groupId: string) => {
    const name = editingGroupName.trim();
    if (name) {
      saveVariants(variants.map(g => g.id === groupId ? { ...g, name } : g));
    }
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  const addValue = (groupId: string) => {
    const val = (newValues[groupId] ?? '').trim();
    if (!val) return;
    saveVariants(variants.map(g =>
      g.id === groupId && !g.values.includes(val)
        ? { ...g, values: [...g.values, val] }
        : g
    ));
    setNewValues(prev => ({ ...prev, [groupId]: '' }));
  };

  const removeValue = (groupId: string, value: string) => {
    saveVariants(variants.map(g =>
      g.id === groupId ? { ...g, values: g.values.filter(v => v !== value) } : g
    ));
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
            {filtered.length === 0 && (
              <li className={styles.emptyList}>Sin resultados</li>
            )}
            {filtered.map(p => {
              const groupCount = (p.variants ?? []).length;
              const valueCount = (p.variants ?? []).reduce((s, g) => s + g.values.length, 0);
              return (
                <li
                  key={p.id}
                  className={`${styles.productItem} ${selectedId === p.id ? styles.selected : ''}`}
                  onClick={() => {
                    setSelectedId(p.id);
                    setNewGroupName('');
                    setNewValues({});
                    setEditingGroupId(null);
                  }}
                >
                  <div className={styles.productName}>{p.name}</div>
                  {p.sku && <div className={styles.productSku}>{p.sku}</div>}
                  <div className={styles.productMeta}>
                    {groupCount === 0
                      ? <span className={styles.noVariants}>Sin variantes</span>
                      : <span className={styles.variantBadge}>{groupCount} grupo{groupCount !== 1 ? 's' : ''} · {valueCount} valor{valueCount !== 1 ? 'es' : ''}</span>
                    }
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ── Panel derecho: gestión de variantes ── */}
        <main className={styles.content}>
          {!selectedProduct ? (
            <div className={sectionStyles.emptyState}>
              <div className={sectionStyles.emptyIcon}>🎨</div>
              <p className={sectionStyles.emptyText}>Seleccioná un producto para gestionar sus variantes</p>
            </div>
          ) : (
            <>
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
              <div className={styles.addGroupRow}>
                <input
                  className={styles.groupInput}
                  type="text"
                  placeholder="Nombre del grupo, ej: Color, Tamaño, Material..."
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addGroup()}
                />
                <button className={styles.addGroupBtn} onClick={addGroup} type="button">
                  + Agregar grupo
                </button>
              </div>

              {/* Sin variantes */}
              {variants.length === 0 && (
                <div className={styles.noGroupsHint}>
                  Este producto no tiene variantes aún. Creá el primer grupo arriba.
                </div>
              )}

              {/* Lista de grupos */}
              <div className={styles.groupsGrid}>
                {variants.map(group => (
                  <div key={group.id} className={styles.groupCard}>
                    {/* Header del grupo */}
                    <div className={styles.groupHeader}>
                      {editingGroupId === group.id ? (
                        <input
                          className={styles.groupNameEdit}
                          value={editingGroupName}
                          autoFocus
                          onChange={e => setEditingGroupName(e.target.value)}
                          onBlur={() => commitEditGroupName(group.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitEditGroupName(group.id);
                            if (e.key === 'Escape') {
                              setEditingGroupId(null);
                              setEditingGroupName('');
                            }
                          }}
                        />
                      ) : (
                        <button
                          className={styles.groupName}
                          onClick={() => startEditGroupName(group)}
                          type="button"
                          title="Hacé click para editar el nombre"
                        >
                          {group.name}
                          <span className={styles.editHint}>✏️</span>
                        </button>
                      )}
                      <button
                        className={styles.deleteGroupBtn}
                        onClick={() => deleteGroup(group.id)}
                        type="button"
                        title="Eliminar grupo"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Valores / chips */}
                    <div className={styles.valuesContainer}>
                      {group.values.length === 0 && (
                        <span className={styles.noValues}>Sin valores aún</span>
                      )}
                      {group.values.map(val => (
                        <span key={val} className={styles.valueChip}>
                          {val}
                          <button
                            type="button"
                            className={styles.chipRemove}
                            onClick={() => removeValue(group.id, val)}
                            title={`Eliminar ${val}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Input para agregar valor */}
                    <div className={styles.addValueRow}>
                      <input
                        className={styles.valueInput}
                        type="text"
                        placeholder={`Agregar valor a ${group.name}...`}
                        value={newValues[group.id] ?? ''}
                        onChange={e => setNewValues(prev => ({ ...prev, [group.id]: e.target.value }))}
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
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
