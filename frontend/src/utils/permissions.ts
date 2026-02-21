// ─── Roles ────────────────────────────────────────────────────────────────────
export type Role = 'admin' | 'editor';

// ─── Permissions ──────────────────────────────────────────────────────────────
export type Permission =
  // Productos
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  // Variantes
  | 'variants.view'
  | 'variants.create'
  | 'variants.edit'
  | 'variants.delete'
  // Categorías
  | 'categories.view'
  | 'categories.create'
  | 'categories.edit'
  | 'categories.delete'
  // Pedidos
  | 'orders.view'
  | 'orders.edit'
  | 'orders.delete'
  | 'orders.markPaid'
  // Reportes
  | 'reports.view';

// ─── Permisos por rol ─────────────────────────────────────────────────────────
const ADMIN_PERMISSIONS: Permission[] = [
  'products.view', 'products.create', 'products.edit', 'products.delete',
  'variants.view', 'variants.create', 'variants.edit', 'variants.delete',
  'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
  'orders.view', 'orders.edit', 'orders.delete', 'orders.markPaid',
  'reports.view',
];

const EDITOR_PERMISSIONS: Permission[] = [
  'products.view',
  'variants.view',
  'categories.view',
  'orders.view', 'orders.edit', 'orders.markPaid',
  // editor NO puede: products/variants/categories CRUD, orders.delete, reports.view
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ADMIN_PERMISSIONS,
  editor: EDITOR_PERMISSIONS,
};

// ─── Helper ───────────────────────────────────────────────────────────────────
export function hasPermission(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
