/**
 * types/admin/pagination.ts
 */

export interface PaginatedResponseDTO<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}