//src/components/ActivityFeed.tsx
import { useState, useEffect } from "react";
import {
  getAdminActivityLogs,
  clearAdminActivityLogs,
} from "../services/adminActivityLogService";
import type { AdminActivityLog } from "../services/adminActivityLogService";
import { ActivityItem } from "./ActivityItem";
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

// ── Opciones de filtro ────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { label: "Todos", value: "all" },
  { label: "Nuevos", value: "create" },
  { label: "Ediciones", value: "edit" },
  { label: "Eliminados", value: "delete" },
  { label: "Usuarios", value: "user" },
  { label: "Alertas", value: "alert" },
];

// ── Skeleton Loader ──────────────────────────────────────────────────────────

function ActivitySkeleton() {
  return (
    <div className="af-skeleton">
      <div className="af-skeleton-icon" />
      <div className="af-skeleton-card">
        <div className="af-skeleton-line" style={{ width: '70%' }} />
        <div className="af-skeleton-line short" />
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ActivityFeedProps {
  /** Intervalo de polling en ms. Default: 10000 */
  pollInterval?: number;
  /** Máximo de eventos a mostrar. Default: 20 */
  maxEvents?: number;
  /** Mostrar esqueleto al cargar. Default: true */
  showSkeleton?: boolean;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ActivityFeed({
  pollInterval = 10000,
  maxEvents = 20,
  showSkeleton = true,
}: ActivityFeedProps) {
  const [logs, setLogs] = useState<AdminActivityLog[]>(() =>
    getAdminActivityLogs().slice(0, maxEvents),
  );
  const [pending, setPending] = useState<AdminActivityLog[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(showSkeleton);

  const handleClear = () => {
    clearAdminActivityLogs();
    setLogs([]);
    setPending([]);
  };

  // Initial load
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

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
          <button
            className="af-btn-clear"
            onClick={handleClear}
            aria-label="Limpiar historial de actividades"
          >
            Limpiar
          </button>
          <span className="af-live-badge" aria-live="polite">
            <span className="af-live-dot" />
            En vivo
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="af-filter-bar" role="group" aria-label="Filtros de actividad">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.value}
            className={`af-filter-btn${filter === f.value ? " active" : ""}`}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
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
          aria-label={`${pending.length} nuevo${pending.length > 1 ? "s" : ""} evento${pending.length > 1 ? "s" : ""}`}
        >
          + {pending.length} nuevo{pending.length > 1 ? "s" : ""} evento
          {pending.length > 1 ? "s" : ""} — click para cargar
        </div>
      )}

      {/* Timeline */}
      <div className="af-timeline">
        <div className="af-timeline-line" />

        {isLoading && showSkeleton ? (
          <div className="af-loading">
            {[...Array(3)].map((_, i) => (
              <ActivitySkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="af-empty">Sin actividad para este filtro.</div>
        ) : (
          filtered.map((log, i) => (
            <ActivityItem
              key={`${log.timestamp}-${i}`}
              log={log}
              config={getConfig(log.action)}
            />
          ))
        )}
      </div>
    </div>
  );
}
