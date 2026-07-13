/**
 * frontend/src/services/contactsService.ts
 */
import { apiFetch } from '../utils/apiClient';

interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

// NUEVO: Interfaz específica para arrepentimiento
export interface WithdrawalFormData {
  fullName: string;
  email: string;
  orderNumber: string;
  purchaseDate: string;
  reason?: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: string;
  isFlagged: boolean;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  total: number;
  pages: number;
  currentPage: number;
}

export const contactsService = {
  async submitContact(data: ContactFormData): Promise<Contact> {
    const body = await apiFetch<ApiSuccess<Contact>>('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!body.success) throw new Error(body.message || 'Error al enviar el mensaje');
    return body.data;
  },

  // NUEVO: Método para enviar el formulario de arrepentimiento
  async submitWithdrawal(data: WithdrawalFormData): Promise<{ contact: Contact; trackingCode: string }> {
    const body = await apiFetch<ApiSuccess<{ contact: Contact; trackingCode: string }>>('/api/contacts/withdrawal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!body.success) throw new Error(body.message || 'Error al procesar la solicitud');
    return body.data;
  },

  async listContacts(page = 1, limit = 20, status?: string, isFlagged?: boolean, search?: string) {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (status) params.append('status', status);
    if (isFlagged !== undefined) params.append('isFlagged', String(isFlagged));
    if (search) params.append('search', search);

    const body = await apiFetch<ApiSuccess<{ data: Contact[]; pagination: Pagination }>>(`/api/admin/contacts?${params.toString()}`);
    if (!body.success) throw new Error(body.message || 'Error al obtener contactos');
    return body.data;
  },

  async getContactById(id: string): Promise<Contact> {
    const body = await apiFetch<ApiSuccess<Contact>>(`/api/admin/contacts/${id}`);
    if (!body.success) throw new Error(body.message || 'Error al obtener el contacto');
    return body.data;
  },

  async updateContact(id: string, updates: { status?: string; isFlagged?: boolean; adminNotes?: string }): Promise<Contact> {
    const body = await apiFetch<ApiSuccess<Contact>>(`/api/admin/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!body.success) throw new Error(body.message || 'Error al actualizar el contacto');
    return body.data;
  },

  async markAsRead(id: string): Promise<Contact> {
    const body = await apiFetch<ApiSuccess<Contact>>(`/api/admin/contacts/${id}/mark-as-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!body.success) throw new Error(body.message || 'Error al marcar como leído');
    return body.data;
  },

  async deleteContact(id: string): Promise<void> {
    const body = await apiFetch<ApiSuccess<Record<string, unknown>>>(`/api/admin/contacts/${id}`, {
      method: 'DELETE',
    });
    if (!body.success) throw new Error(body.message || 'Error al eliminar el contacto');
  },
};