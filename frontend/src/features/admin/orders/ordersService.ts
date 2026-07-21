import { apiFetch } from '../../../utils/apiClient';
import type { OrderStatus, PaymentStatus } from '../../../context/AdminOrdersContext';

export interface Order {
  id: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    productImage?: string;
    quantity: number;
    unitPrice: number;
  }>;
  total: number;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paidAt?: string;
  notes?: string;
  statusHistory?: Array<{ status: OrderStatus; changedAt: string; note?: string }>;
}

interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ApiOrderItem {
  productId: string;
  productSkuId?: string;
  sku?: string;
  variant?: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
}

interface ApiOrderHistoryEntry {
  status: string;
  changedAt: string;
  note?: string;
}

interface ApiOrder {
  id: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  items?: ApiOrderItem[];
  total: number;
  status: string;
  paymentStatus?: string;
  paidAt?: string;
  notes?: string;
  statusHistory?: ApiOrderHistoryEntry[];
}

interface PaginatedApiOrders {
  data: ApiOrder[];
  total: number;
  page: number;
  totalPages: number;
}

export type BulkOrderAction = 'confirm' | 'ship' | 'cancel';

export interface BulkUpdateOrdersPayload {
  orderIds: string[];
  action: BulkOrderAction;
  note?: string;
}

export interface BulkUpdateOrdersResult {
  action: BulkOrderAction;
  targetStatus: OrderStatus;
  total: number;
  success: number;
  failed: number;
  results: Array<{ id: string; success: boolean; reason?: string }>;
}

function normalizeOrderStatus(status: string): OrderStatus {
  const normalized = status.replace('_', '-');
  if (normalized === 'en-preparacion') return 'en-preparacion';
  if (normalized === 'preparado') return 'preparado';
  if (normalized === 'pendiente') return 'pendiente';
  if (normalized === 'confirmado') return 'confirmado';
  if (normalized === 'enviado') return 'enviado';
  if (normalized === 'entregado') return 'entregado';
  return 'cancelado';
}

function normalizePaymentStatus(status?: string): PaymentStatus {
  const normalized = (status ?? 'no-abonado').replace('_', '-');
  if (normalized === 'abonado') return 'abonado';
  return 'no-abonado';
}

export function mapApiOrderToOrder(api: ApiOrder): Order {
  return {
    id: api.id,
    createdAt: api.createdAt,
    customer: {
      firstName: api.customer.firstName,
      lastName: api.customer.lastName,
      email: api.customer.email,
      phone: api.customer.phone,
    },
    items: (api.items ?? []).map((item) => ({
      productId: item.productId,
      productSkuId: item.productSkuId,
      sku: item.sku,
      variant: item.variant,
      productName: item.productName,
      productImage: item.productImage,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    })),

    total: Number(api.total),
    status: normalizeOrderStatus(api.status),
    paymentStatus: normalizePaymentStatus(api.paymentStatus),
    paidAt: api.paidAt,
    notes: api.notes,
    statusHistory: (api.statusHistory ?? []).map((entry) => ({
      status: normalizeOrderStatus(entry.status),
      changedAt: entry.changedAt,
      note: entry.note,
    })),
  };
}

export async function fetchAdminOrders(
  token: string,
  params: { page?: number; limit?: number; q?: string; status?: OrderStatus; paymentStatus?: PaymentStatus } = {},
  signal?: AbortSignal
): Promise<PaginatedApiOrders> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.q) qs.set('q', params.q);
  if (params.status) qs.set('status', params.status);
  if (params.paymentStatus) qs.set('paymentStatus', params.paymentStatus);

  const url = `/api/admin/orders${qs.toString() ? `?${qs.toString()}` : ''}`;
  const body = await apiFetch<ApiSuccess<PaginatedApiOrders>>(url, { signal }, token);
  return body.data;
}

export async function fetchAllAdminOrders(token: string): Promise<Order[]> {
  const limit = 100;
  let page = 1;
  let totalPages = 1;
  const all: ApiOrder[] = [];

  while (page <= totalPages) {
    const response = await fetchAdminOrders(token, { page, limit });
    all.push(...response.data);
    totalPages = response.totalPages;
    page += 1;
  }

  return all.map(mapApiOrderToOrder);
}

export async function fetchAdminOrderById(token: string, id: string): Promise<Order> {
  const body = await apiFetch<ApiSuccess<ApiOrder>>(`/api/admin/orders/${id}`, {}, token);
  return mapApiOrderToOrder(body.data);
}

export async function updateAdminOrder(
  token: string,
  id: string,
  payload: Partial<Pick<Order, 'status' | 'paymentStatus' | 'paidAt' | 'notes'>>
): Promise<Order> {
  const body = await apiFetch<ApiSuccess<ApiOrder>>(`/api/admin/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
  return mapApiOrderToOrder(body.data);
}

export async function updateAdminOrderStatus(
  token: string,
  id: string,
  status: OrderStatus,
  note?: string
): Promise<Order> {
  const body = await apiFetch<ApiSuccess<ApiOrder>>(`/api/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  }, token);
  return mapApiOrderToOrder(body.data);
}

export async function updateAdminOrderPaymentStatus(
  token: string,
  id: string,
  paymentStatus: PaymentStatus
): Promise<Order> {
  const body = await apiFetch<ApiSuccess<ApiOrder>>(`/api/admin/orders/${id}/payment`, {
    method: 'PATCH',
    body: JSON.stringify({ paymentStatus }),
  }, token);
  return mapApiOrderToOrder(body.data);
}

export async function deleteAdminOrder(token: string, id: string): Promise<void> {
  await apiFetch<unknown>(`/api/admin/orders/${id}`, { method: 'DELETE' }, token);
}

export async function bulkUpdateAdminOrdersStatus(
  token: string,
  payload: BulkUpdateOrdersPayload
): Promise<BulkUpdateOrdersResult> {
  const body = await apiFetch<ApiSuccess<BulkUpdateOrdersResult>>('/api/admin/orders/bulk-status', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, token);
  return body.data;
}

export interface OrdersPdfExportParams {
  status?: string;
  paymentStatus?: string;
  q?: string;
  title?: string;
}

/**
 * GET /api/admin/orders/export-pdf
 * Genera y descarga el reporte de pedidos en PDF con el estilo visual del catálogo Allmart.
 * La respuesta es un Blob binario (application/pdf).
 */
export async function exportOrdersPdfFromBackend(
  token: string,
  params: OrdersPdfExportParams = {}
): Promise<void> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.paymentStatus) qs.set('paymentStatus', params.paymentStatus);
  if (params.q) qs.set('q', params.q);
  if (params.title) qs.set('title', params.title);

  const url = `/api/admin/orders/export-pdf${qs.toString() ? `?${qs.toString()}` : ''}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => String(response.status));
    throw new Error(`Error al generar el PDF (${response.status}): ${errText}`);
  }

  const blob = await response.blob();

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const filenameMatch = disposition.match(/filename[^;=\n]*=(?:["']?)([^"'\n;]+)/);
  const filename = filenameMatch?.[1]?.trim()
    ?? `pedidos-todos-${new Date().toISOString().slice(0, 10)}.pdf`;

  const url2 = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url2;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url2);
}
