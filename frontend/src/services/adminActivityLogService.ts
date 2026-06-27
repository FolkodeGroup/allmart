// Servicio de logs de actividad administrativa
// Guarda logs en memoria y en localStorage para persistencia temporal

export type AdminActivityLog = {
  timestamp: string; // ISO
  user: string; // email o id
  action: string; // 'create', 'edit', 'delete', etc.
  entity: string; // 'product', 'category', etc.
  entityId?: string;
  details?: Record<string, unknown>;
};

const STORAGE_KEY = 'admin_activity_logs';
const ADMIN_USER_KEY = 'allmart_admin_user';

function getLogs(): AdminActivityLog[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: AdminActivityLog[] = JSON.parse(raw);
    const storedUser = localStorage.getItem(ADMIN_USER_KEY) || null;
    // Normalize entries: if user is missing or placeholder, fill from stored user when available
    return parsed.map((l) => ({
      ...l,
      user: (!l.user || l.user === 'desconocido') ? (storedUser ?? l.user ?? 'Usuario desconocido') : l.user,
    }));
  } catch {
    return [];
  }
}

function saveLogs(logs: AdminActivityLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export function logAdminActivity(log: AdminActivityLog) {
  const storedUser = localStorage.getItem(ADMIN_USER_KEY) || null;
  const normalizedLog: AdminActivityLog = {
    ...log,
    user: (!log.user || log.user === 'desconocido') ? (storedUser ?? log.user ?? 'Usuario desconocido') : log.user,
  };
  const logs = getLogs();
  logs.push(normalizedLog);
  saveLogs(logs);
}

export function getAdminActivityLogs(): AdminActivityLog[] {
  try {
    return getLogs().slice().sort((a, b) => {
      const ta = new Date(a.timestamp).getTime() || 0;
      const tb = new Date(b.timestamp).getTime() || 0;
      return tb - ta; // más reciente primero
    });
  } catch {
    return getLogs();
  }
}

export function clearAdminActivityLogs() {
  localStorage.removeItem(STORAGE_KEY);
}

export function deleteAdminActivityLog(timestamp: string, index: number) {
  const logs = getLogs();
  // Find by timestamp and relative position for uniqueness
  const matches = logs.filter((l) => l.timestamp === timestamp);
  if (matches.length <= 1) {
    saveLogs(logs.filter((l) => l.timestamp !== timestamp));
  } else {
    let count = 0;
    saveLogs(logs.filter((l) => {
      if (l.timestamp === timestamp) {
        if (count === index) { count++; return false; }
        count++;
      }
      return true;
    }));
  }
}
