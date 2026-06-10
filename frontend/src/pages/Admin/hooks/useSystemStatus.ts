import { useEffect, useState } from 'react';

export interface SystemStatus {
  latency: number;
  isOnline: boolean;
  statusLabel: 'Offline' | 'Lento' | 'Online';
  statusColor: string;
}

/**
 * useSystemStatus
 * Monitorea la latencia simulada y el estado online/offline del navegador.
 * Polling cada 30s y suscripción a eventos `online`/`offline`.
 */
export function useSystemStatus(): SystemStatus {
  const [latency, setLatency] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const check = async () => {
      const start = Date.now();
      try { await new Promise((r) => setTimeout(r, 80)); } catch { /* noop */ }
      setLatency(Date.now() - start);
    };
    check();
    const interval = setInterval(check, 30_000);
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  const statusLabel: SystemStatus['statusLabel'] = !isOnline
    ? 'Offline'
    : latency > 500
      ? 'Lento'
      : 'Online';
  const statusColor = !isOnline ? '#ef4444' : latency > 500 ? '#f59e0b' : '#22c55e';

  return { latency, isOnline, statusLabel, statusColor };
}
