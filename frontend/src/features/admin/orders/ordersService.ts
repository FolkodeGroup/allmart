import { apiFetch } from '../../../utils/apiClient';

export type OrderStatus =
  | 'pendiente'
  | 'confirmado'
  | 'en-preparacion'
  | 'enviado'
  | 'entregado'
  | 'cancelado';

export type PaymentStatus = 'no-abonado' | 'abonado';

export interface Order {
  id: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
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

function mapApiOrderToOrder(api: ApiOrder): Order {
  return {
    id: api.id,
    createdAt: api.createdAt,
    customer: {
      firstName: api.customer.firstName,
      lastName: api.customer.lastName,
      email: api.customer.email,
    },
    items: (api.items ?? []).map((item) => ({
      productId: item.productId,
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
  params: { page?: number; limit?: number; q?: string; status?: OrderStatus; paymentStatus?: PaymentStatus } = {}
): Promise<PaginatedApiOrders> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.q) qs.set('q', params.q);
  if (params.status) qs.set('status', params.status);
  if (params.paymentStatus) qs.set('paymentStatus', params.paymentStatus);

  const url = `/api/admin/orders${qs.toString() ? `?${qs.toString()}` : ''}`;
  const body = await apiFetch<ApiSuccess<PaginatedApiOrders>>(url, {}, token);
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
