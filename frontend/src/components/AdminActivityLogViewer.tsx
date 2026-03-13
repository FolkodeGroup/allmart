import { useState } from 'react';
import { getAdminActivityLogs, clearAdminActivityLogs } from '../services/adminActivityLogService';

export function AdminActivityLogViewer() {
  const [logs, setLogs] = useState(() => getAdminActivityLogs());

  const handleClear = () => {
    clearAdminActivityLogs();
    setLogs([]);
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h2>Logs de Actividad Administrativa</h2>
      <button onClick={handleClear} style={{ marginBottom: 16 }}>Limpiar logs</button>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Fecha/Hora</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Usuario</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Acción</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Entidad</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>ID</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Detalles</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 16 }}>No hay logs registrados.</td></tr>
          ) : logs.map((log, i) => (
            <tr key={i}>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{new Date(log.timestamp).toLocaleString()}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{log.user}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{log.action}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{log.entity}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{log.entityId || '-'}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}><pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(log.details, null, 2)}</pre></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
