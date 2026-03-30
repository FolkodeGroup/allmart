import { apiFetch } from '../utils/apiClient';

export interface CreatePublicOrderPayload {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    productImage?: string;
    unitPrice: number;
    quantity: number;
  }>;
  total: number;
  notes?: string;
}

interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface LegacyCreateOrderResponse {
  orderId: string;
  message?: string;
}

interface CreateOrderData {
  orderId: string;
}

type CreateOrderResponse = ApiSuccess<CreateOrderData> | LegacyCreateOrderResponse;

function hasSuccessEnvelope(body: CreateOrderResponse): body is ApiSuccess<CreateOrderData> {
  return 'success' in body;
}

export async function createPublicOrder(
  payload: CreatePublicOrderPayload,
): Promise<CreateOrderData> {
  const body = await apiFetch<CreateOrderResponse>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (hasSuccessEnvelope(body)) {
    if (!body.success || !body.data?.orderId) {
      throw new Error(body.message ?? 'No se pudo crear el pedido');
    }
    return { orderId: body.data.orderId };
  }

  if (!body.orderId) {
    throw new Error(body.message ?? 'No se pudo crear el pedido');
  }

  return { orderId: body.orderId };
}