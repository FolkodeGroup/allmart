/**
 * types/enums.ts
 * Enumeraciones globales compartidas entre módulos.
 * Agregar nuevas a medida que crezca el proyecto.
 */

export enum UserRole {
  ADMIN    = 'admin',
  EDITOR   = 'editor',
  CUSTOMER = 'customer',  // cliente final (antes VIEWER)
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
}

export enum StockMovementType {
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment',
}
