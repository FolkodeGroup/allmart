// Servicio de logs de actividad administrativa
// Guarda logs en memoria y en localStorage para persistencia temporal

export type AdminActivityLog = {
  timestamp: string; // ISO
  user: string; // email o id
  action: string; // 'create', 'edit', 'delete', etc.
  entity: string; // 'product', 'category', etc.
  entityId?: string;
  details?: Record<string, any>;
};

const STORAGE_KEY = 'admin_activity_logs';

function getLogs(): AdminActivityLog[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLogs(logs: AdminActivityLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export function logAdminActivity(log: AdminActivityLog) {
  const logs = getLogs();
  logs.push(log);
  saveLogs(logs);
}

export function getAdminActivityLogs(): AdminActivityLog[] {
  return getLogs();
}

export function clearAdminActivityLogs() {
  localStorage.removeItem(STORAGE_KEY);
}
