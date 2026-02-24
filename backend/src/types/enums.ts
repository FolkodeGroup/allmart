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
  PENDING    = 'pendiente',
  CONFIRMED  = 'confirmado',
  PROCESSING = 'en-preparacion',
  SHIPPED    = 'enviado',
  DELIVERED  = 'entregado',
  CANCELLED  = 'cancelado',
}

export enum PaymentStatus {
  UNPAID = 'no-abonado',
  PAID   = 'abonado',
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

export enum CategoryStatus {
  ACTIVE   = 'active',
  INACTIVE = 'inactive',
}
