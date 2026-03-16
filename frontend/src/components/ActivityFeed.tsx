//src/components/activityFeed.tsx
import { useState, useEffect } from "react";
import {
  getAdminActivityLogs,
  clearAdminActivityLogs,
} from "../services/adminActivityLogService";
import type { AdminActivityLog } from "../services/adminActivityLogService";
import "./ActivityFeed.css";

// ── Configuración visual por tipo de acción ───────────────────────────────────

const ACTION_CONFIG: Record<
  string,
  { icon: string; label: string; bg: string; tagBg: string; tagColor: string }
> = {
  create: {
    icon: "🛒",
    label: "Nuevo",
    bg: "#E6F1FB",
    tagBg: "#E6F1FB",
    tagColor: "#0C447C",
  },
  edit: {
    icon: "✏️",
    label: "Edición",
    bg: "#EAF3DE",
    tagBg: "#EAF3DE",
    tagColor: "#27500A",
  },
  delete: {
    icon: "🗑️",
    label: "Eliminado",
    bg: "#FCEBEB",
    tagBg: "#FCEBEB",
    tagColor: "#791F1F",
  },
  order: {
    icon: "🛒",
    label: "Pedido",
    bg: "#E6F1FB",
    tagBg: "#E6F1FB",
    tagColor: "#0C447C",
  },
  user: {
    icon: "👤",
    label: "Usuario",
    bg: "#EEEDFE",
    tagBg: "#EEEDFE",
    tagColor: "#3C3489",
  },
  alert: {
    icon: "⚠️",
    label: "Alerta",
    bg: "#FAEEDA",
    tagBg: "#FAEEDA",
    tagColor: "#633806",
  },
  default: {
    icon: "📋",
    label: "Acción",
    bg: "#F1EFE8",
    tagBg: "#F1EFE8",
    tagColor: "#444441",
  },
};

function getConfig(action: string) {
  return ACTION_CONFIG[action?.toLowerCase()] ?? ACTION_CONFIG.default;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(timestamp: string): string {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return new Date(timestamp).toLocaleDateString("es-AR");
}

function buildDescription(log: AdminActivityLog): string {
  return [log.action, log.entity, log.entityId ? `#${log.entityId}` : ""]
    .filter(Boolean)
    .join(" — ");
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
  /** Intervalo de polling en ms. Default: 10000 */
  pollInterval?: number;
  /** Máximo de eventos a mostrar. Default: 20 */
  maxEvents?: number;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ActivityFeed({
  pollInterval = 10000,
  maxEvents = 20,
}: ActivityFeedProps) {
  const [logs, setLogs] = useState<AdminActivityLog[]>(() =>
    getAdminActivityLogs().slice(0, maxEvents),
  );
  const [pending, setPending] = useState<AdminActivityLog[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const handleClear = () => {
    clearAdminActivityLogs();
    setLogs([]);
    setPending([]);
  };

  // Polling: detecta nuevos logs comparando el timestamp del más reciente
  useEffect(() => {
    const interval = setInterval(() => {
      const fresh = getAdminActivityLogs();
      const latestKnown = logs[0]?.timestamp;
      const newItems = latestKnown
        ? fresh.filter((l) => new Date(l.timestamp) > new Date(latestKnown))
        : [];
      if (newItems.length > 0) {
        setPending((prev) => [...newItems, ...prev]);
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [logs, pollInterval]);

  const loadPending = () => {
    setLogs((prev) => [...pending, ...prev].slice(0, maxEvents));
    setPending([]);
  };

  const filtered = logs.filter(
    (l) => filter === "all" || l.action?.toLowerCase() === filter,
  );

  return (
    <div className="af-wrapper">
      {/* Header */}
      <div className="af-header">
        <h3 className="af-title">Feed de actividad</h3>
        <div className="af-header-actions">
          <button className="af-btn-clear" onClick={handleClear}>
            Limpiar
          </button>
          <span className="af-live-badge">
            <span className="af-live-dot" />
            En vivo
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="af-filter-bar">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.value}
            className={`af-filter-btn${filter === f.value ? " active" : ""}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Banner nuevos eventos */}
      {pending.length > 0 && (
        <div
          className="af-new-banner"
          onClick={loadPending}
          onKeyDown={(e) => e.key === "Enter" && loadPending()}
          role="button"
          tabIndex={0}
        >
          + {pending.length} nuevo{pending.length > 1 ? "s" : ""} evento
          {pending.length > 1 ? "s" : ""} — click para cargar
        </div>
      )}

      {/* Timeline */}
      <div className="af-timeline">
        <div className="af-timeline-line" />

        {filtered.length === 0 ? (
          <div className="af-empty">Sin actividad para este filtro.</div>
        ) : (
          filtered.map((log, i) => {
            const cfg = getConfig(log.action);
            return (
              <div key={i} className="af-event">
                {/* bg inline: valor dinámico de ACTION_CONFIG */}
                <div className="af-event-icon" style={{ background: cfg.bg }}>
                  {cfg.icon}
                </div>

                <div className="af-event-body">
                  <div className="af-card">
                    <div className="af-card-top">
                      <span className="af-card-name">{log.user}</span>
                      <span className="af-card-time">
                        {timeAgo(log.timestamp)}
                      </span>
                    </div>
                    <div className="af-card-desc">{buildDescription(log)}</div>

                    {/* colores inline: valores dinámicos de ACTION_CONFIG */}
                    <span
                      className="af-tag"
                      style={{ background: cfg.tagBg, color: cfg.tagColor }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
