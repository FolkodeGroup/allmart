//src/components/ActivityFeed.tsx
import { useState, useEffect, useCallback } from "react";
import {
  getAdminActivityLogs,
  clearAdminActivityLogs,
  deleteAdminActivityLog,
} from "../services/adminActivityLogService";
import type { AdminActivityLog } from "../services/adminActivityLogService";
import "./activityFeed.css";

// ── Configuración visual por tipo de acción ───────────────────────────────────

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

// ── Opciones de filtro ────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { label: "Todos", value: "all" },
  { label: "Nuevos", value: "create" },
  { label: "Ediciones", value: "edit" },
  { label: "Eliminados", value: "delete" },
  { label: "Usuarios", value: "user" },
  { label: "Alertas", value: "alert" },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface ActivityFeedProps {
  pollInterval?: number;
  maxEvents?: number;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ActivityFeed({
  pollInterval = 10000,
  maxEvents = 50,
}: ActivityFeedProps) {
  const [logs, setLogs] = useState<AdminActivityLog[]>(() =>
    getAdminActivityLogs().slice(0, maxEvents),
  );
  const [filter, setFilter] = useState<string>("all");

  // Auto-reload: merge new logs automatically
  useEffect(() => {
    const interval = setInterval(() => {
      const fresh = getAdminActivityLogs().slice(0, maxEvents);
      setLogs(fresh);
    }, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval, maxEvents]);

  const handleClear = useCallback(() => {
    clearAdminActivityLogs();
    setLogs([]);
  }, []);

  const handleDelete = useCallback((log: AdminActivityLog, idx: number) => {
    deleteAdminActivityLog(log.timestamp, idx);
    setLogs(getAdminActivityLogs().slice(0, maxEvents));
  }, [maxEvents]);

  const filtered = logs.filter((l) => {
    if (filter === "all") return true;
    return (l.action || "").toLowerCase().trim() === filter.toLowerCase().trim();
  });

  // Description builder
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
      {/* Header */}
      <div className="af-header">
        <div className="af-header-actions">
          <button className="af-btn-clear" onClick={handleClear} aria-label="Limpiar historial">
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
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table with scroll */}
      <div className="af-table-scroll">
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
                  <tr key={`${log.timestamp}-${i}`} className="af-row">
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
                        onClick={() => handleDelete(log, i)}
                        aria-label="Eliminar este evento"
                        title="Eliminar"
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
    </div>
  );
}
