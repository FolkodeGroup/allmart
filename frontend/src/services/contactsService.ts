/**
 * services/contactsService.ts
 * Servicio para enviar mensajes de contacto desde el formulario público.
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

export const contactsService = {
  /**
   * Envía un mensaje de contacto desde el formulario público.
   * @param data Datos del formulario de contacto
   * @returns Contacto creado
   */
  async submitContact(data: ContactFormData): Promise<Contact> {
    const body = await apiFetch<ApiSuccess<Contact>>('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!body.success) {
      throw new Error(body.message || 'Error al enviar el mensaje');
    }

    return body.data;
  },

  /**
   * [ADMIN] Obtiene la lista de contactos con paginación y filtros.
   */
  async listContacts(
    page: number = 1,
    limit: number = 20,
    status?: string,
    isFlagged?: boolean,
    search?: string,
  ): Promise<{ data: Contact[]; pagination: any }> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (status) params.append('status', status);
    if (isFlagged !== undefined) params.append('isFlagged', String(isFlagged));
    if (search) params.append('search', search);

    const body = await apiFetch<ApiSuccess<any>>(`/api/admin/contacts?${params.toString()}`);

    if (!body.success) {
      throw new Error(body.message || 'Error al obtener contactos');
    }

    return body.data;
  },

  /**
   * [ADMIN] Obtiene un contacto específico por ID.
   */
  async getContactById(id: string): Promise<Contact> {
    const body = await apiFetch<ApiSuccess<Contact>>(`/api/admin/contacts/${id}`);

    if (!body.success) {
      throw new Error(body.message || 'Error al obtener el contacto');
    }

    return body.data;
  },

  /**
   * [ADMIN] Actualiza el estado de un contacto.
   */
  async updateContact(
    id: string,
    updates: {
      status?: string;
      isFlagged?: boolean;
      adminNotes?: string;
    },
  ): Promise<Contact> {
    const body = await apiFetch<ApiSuccess<Contact>>(`/api/admin/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!body.success) {
      throw new Error(body.message || 'Error al actualizar el contacto');
    }

    return body.data;
  },

  /**
   * [ADMIN] Marca un contacto como leído.
   */
  async markAsRead(id: string): Promise<Contact> {
    const body = await apiFetch<ApiSuccess<Contact>>(`/api/admin/contacts/${id}/mark-as-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!body.success) {
      throw new Error(body.message || 'Error al marcar como leído');
    }

    return body.data;
  },

  /**
   * [ADMIN] Elimina un contacto.
   */
  async deleteContact(id: string): Promise<void> {
    const body = await apiFetch<ApiSuccess<any>>(`/api/admin/contacts/${id}`, {
      method: 'DELETE',
    });

    if (!body.success) {
      throw new Error(body.message || 'Error al eliminar el contacto');
    }
  },
};
