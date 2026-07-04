import { apiFetch } from '../utils/apiClient';

export type AdminActivityLog = {
  id?: string; // Ahora viene de la DB
  timestamp: string; 
  user: string; 
  action: string; 
  entity: string; 
  entityId?: string;
  details?: Record<string, unknown>;
};

// No enviamos await para no bloquear la UI al hacer log (Fire and Forget)
export function logAdminActivity(log: AdminActivityLog) {
  apiFetch('/api/admin/audit-logs', {
    method: 'POST',
    body: JSON.stringify(log)
  }).catch(err => console.error('Error guardando log de auditoría', err));
}

// Ahora es asíncrono
export async function getAdminActivityLogs(): Promise<AdminActivityLog[]> {
  try {
    const res = await apiFetch<{ data: AdminActivityLog[] }>('/api/admin/audit-logs?limit=100');
    return res.data;
  } catch {
    return [];
  }
}

export async function clearAdminActivityLogs() {
  await apiFetch('/api/admin/audit-logs/clear', { method: 'DELETE' });
}

export async function deleteAdminActivityLog(id: string) {
  if (!id) return;
  await apiFetch(`/api/admin/audit-logs/${id}`, { method: 'DELETE' });
}