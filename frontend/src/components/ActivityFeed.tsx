import { useState, useEffect, useCallback } from "react";
import {
  getAdminActivityLogs,
  clearAdminActivityLogs,
  deleteAdminActivityLog,
} from "../services/adminActivityLogService";
import type { AdminActivityLog } from "../services/adminActivityLogService";
import "./activityFeed.css";

const ACTION_CONFIG: Record<
  string,
  { icon: string; label: string; tagBg: string; tagColor: string }
> = {
  create: { icon: "", label: "Nuevo", tagBg: "var(--color-primary)", tagColor: "#fff" },
  edit: { icon: "", label: "Edición", tagBg: "var(--color-accent-dark)", tagColor: "var(--color-text-inverse)" },
  delete: { icon: "", label: "Eliminado", tagBg: "var(--color-error-mode)", tagColor: "#fff" },
  order: { icon: "", label: "Pedido", tagBg: "var(--color-secondary)", tagColor: "#fff" },
  user: { icon: "", label: "Usuario", tagBg: "var(--color-tertiary)", tagColor: "#fff" },
  alert: { icon: "", label: "Alerta", tagBg: "var(--color-warning-mode)", tagColor: "#fff" },
  default: { icon: "", label: "Acción", tagBg: "var(--color-bg-secondary)", tagColor: "var(--color-text-tertiary)" },
};

function getConfig(action: string) {
  return ACTION_CONFIG[action?.toLowerCase()] ?? ACTION_CONFIG.default;
}

function timeAgo(timestamp: string): string {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return new Date(timestamp).toLocaleDateString("es-AR");
}

const FILTER_OPTIONS = [
  { label: "Todos", value: "all" },
  { label: "Nuevos", value: "create" },
  { label: "Ediciones", value: "edit" },
  { label: "Eliminados", value: "delete" },
  { label: "Usuarios", value: "user" },
  { label: "Alertas", value: "alert" },
];

interface ActivityFeedProps {
  pollInterval?: number;
  maxEvents?: number;
}

export function ActivityFeed({
  pollInterval = 10000,
  maxEvents = 50,
}: ActivityFeedProps) {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const fresh = await getAdminActivityLogs();
        setLogs(fresh.slice(0, maxEvents));
      } catch (error) {
        console.error("Error al obtener los logs de actividad:", error);
      }
    };

    fetchLogs();

    const interval = setInterval(fetchLogs, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval, maxEvents]);

  const handleClear = useCallback(async () => {
    try {
      await clearAdminActivityLogs();
      setLogs([]);
    } catch (error) {
      console.error("Error al limpiar los logs:", error);
    }
  }, []);

  const handleDelete = useCallback(async (log: AdminActivityLog) => {
    if (!log.id) return;
    try {
      await deleteAdminActivityLog(log.id);
      const fresh = await getAdminActivityLogs();
      setLogs(fresh.slice(0, maxEvents));
    } catch (error) {
      console.error("Error al eliminar el log:", error);
    }
  }, [maxEvents]);

  const filtered = logs.filter((l) => {
    if (filter === "all") return true;
    return (l.action || "").toLowerCase().trim() === filter.toLowerCase().trim();
  });

  const describe = (log: AdminActivityLog): string => {
    const actionMap: Record<string, string> = {
      create: "Creó", edit: "Editó", delete: "Eliminó",
      order: "Nuevo pedido", user: "Usuario", alert: "Alerta",
    };
    const action = actionMap[log.action?.toLowerCase() || ""] || log.action;
    const entityMap: Record<string, string> = {
      product: "producto", category: "categoría", order: "pedido", user: "usuario",
    };
    const entity = entityMap[log.entity?.toLowerCase() || ""] || log.entity || "";
    const name = log.details?.name || log.entityId || "";
    return `${action} ${entity} ${name}`.trim();
  };

  return (
    <div className="af-wrapper">
      {/* Header con título visible */}
      <div className="af-header">
        <h3 className="af-title">Actividad Reciente</h3>
        <div className="af-header-actions">
          <button className="af-btn-clear" onClick={handleClear} aria-label="Limpiar historial" type="button">
            Limpiar todo
          </button>
          <span className="af-live-badge" aria-live="polite">
            <span className="af-live-dot" />
            En vivo
          </span>
        </div>
      </div>

      {/* Filtros como tabs */}
      <div className="af-filter-bar" role="tablist" aria-label="Filtros de actividad">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.value}
            className={`af-filter-btn${filter === f.value ? " active" : ""}`}
            onClick={() => setFilter(f.value)}
            role="tab"
            aria-selected={filter === f.value}
            type="button"
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabla Escritorio (>= 768px) */}
      <div className="af-table-scroll af-desktop-only">
        {filtered.length === 0 ? (
          <div className="af-empty">Sin actividad para este filtro.</div>
        ) : (
          <table className="af-table">
            <thead className="af-table-header">
              <tr className="af-table-tr">
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Usuario</th>
                <th>Tiempo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => {
                const cfg = getConfig(log.action);
                return (
                  <tr key={log.id || `${log.timestamp}-${i}`} className="af-row">
                    <td>
                      <span
                        className="af-tag"
                        style={{ backgroundColor: cfg.tagBg, color: cfg.tagColor }}
                      >
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td className="af-desc">{describe(log)}</td>
                    <td className="af-user">{log.user || "—"}</td>
                    <td className="af-time">{timeAgo(log.timestamp)}</td>
                    <td>
                      <button
                        className="af-delete-btn"
                        onClick={() => handleDelete(log)}
                        aria-label="Eliminar este evento"
                        title="Eliminar"
                        type="button"
                      >
                        ELIMINAR
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Tarjetas Móviles (< 768px) */}
      <div className="af-mobile-cards-list">
        {filtered.length === 0 ? (
          <div className="af-empty">Sin actividad para este filtro.</div>
        ) : (
          filtered.map((log, i) => {
            const cfg = getConfig(log.action);
            return (
              <div key={log.id || `${log.timestamp}-${i}`} className="af-mobile-card">
                <div className="af-mobile-card-header">
                  <span
                    className="af-tag"
                    style={{ backgroundColor: cfg.tagBg, color: cfg.tagColor }}
                  >
                    {cfg.label}
                  </span>
                  <span className="af-mobile-time">{timeAgo(log.timestamp)}</span>
                </div>
                <div className="af-mobile-card-body">
                  <p className="af-mobile-desc">{describe(log)}</p>
                  <span className="af-mobile-user">Por: {log.user || "desconocido"}</span>
                </div>
                <div className="af-mobile-card-footer">
                  <button
                    className="af-delete-btn-mobile"
                    onClick={() => handleDelete(log)}
                    type="button"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}