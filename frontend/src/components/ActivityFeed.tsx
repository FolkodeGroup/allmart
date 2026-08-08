import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getAdminActivityLogs,
  clearAdminActivityLogs,
  deleteAdminActivityLog,
  type AdminActivityLog,
} from '../services/adminActivityLogService';
import { Modal } from './ui/Modal';
import { ModalConfirm } from './ui/ModalConfirm/ModalConfirm';
import toast from 'react-hot-toast';
import { Search, Trash2, ExternalLink } from 'lucide-react';
import './activityFeed.css';

const DISPLAY_LIMIT = 10;

function formatOrderCode(id?: string | null): string {
  if (!id) return '';
  const clean = id.replace(/-/g, '');
  return `#${clean.slice(0, 8).toUpperCase()}`;
}

function isUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function formatActivityDescription(log: AdminActivityLog): string {
  const action = (log.action || '').toLowerCase().trim();
  const entity = (log.entity || '').toLowerCase().trim();
  const details = log.details || {};
  const entityId = log.entityId || '';

  const isOrder = entity === 'order' || entity === 'orders' || action.includes('order') || action.includes('status');
  const isProduct = entity === 'product' || entity === 'products';
  const isCategory = entity === 'category' || entity === 'categories';
  const isSupplier = entity === 'supplier' || entity === 'suppliers';
  const isBanner = entity === 'banner' || entity === 'banners';

  let targetName = (details.name as string) || (details.title as string) || '';
  if (!targetName) {
    if (isOrder || isUUID(entityId)) {
      targetName = formatOrderCode(entityId || (details.orderId as string));
    } else {
      targetName = entityId;
    }
  }

  if (action === 'create' || action === 'crear') {
    if (isProduct) return `Se creó el producto "${targetName}"`;
    if (isCategory) return `Se creó la categoría "${targetName}"`;
    if (isOrder) return `Se registró el pedido ${targetName}`;
    if (isBanner) return `Se creó el banner "${targetName}"`;
    if (isSupplier) return `Se creó el proveedor "${targetName}"`;
    return `Se creó ${entity || 'un registro'} ${targetName}`;
  }

  if (action === 'edit' || action === 'editar' || action === 'update') {
    if (isProduct) return `Se actualizó el producto "${targetName}"`;
    if (isCategory) return `Se actualizó la categoría "${targetName}"`;
    if (isOrder) return `Se actualizó el pedido ${targetName}`;
    if (isBanner) return `Se actualizó el banner "${targetName}"`;
    if (isSupplier) return `Se actualizó el proveedor "${targetName}"`;
    return `Se actualizó ${entity || 'el registro'} ${targetName}`;
  }

  if (action === 'delete' || action === 'eliminar') {
    if (isProduct) return `Se eliminó el producto "${targetName}"`;
    if (isCategory) return `Se eliminó la categoría "${targetName}"`;
    if (isOrder) return `Se canceló el pedido ${targetName}`;
    if (isBanner) return `Se eliminó el banner "${targetName}"`;
    if (isSupplier) return `Se eliminó el proveedor "${targetName}"`;
    return `Se eliminó ${entity || 'el registro'} ${targetName}`;
  }

  if (action === 'update-status') {
    const toStatus = (details.to as string) || (details.status as string) || '';
    const statusLabels: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      'en-preparacion': 'En preparación',
      en_preparacion: 'En preparación',
      preparado: 'Preparado',
      enviado: 'Enviado',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
    };
    const statusText = statusLabels[toStatus] ? ` a "${statusLabels[toStatus]}"` : '';
    return `Se cambió el estado del pedido ${targetName}${statusText}`;
  }

  if (action === 'confirm-order') return `Se confirmó el pedido ${targetName}`;
  if (action === 'preparation-order') return `Se inició la preparación del pedido ${targetName}`;
  if (action === 'ready-order') return `Se empaquetó el pedido ${targetName}`;
  if (action === 'dispatch-order') return `Se despachó el pedido ${targetName}`;
  if (action === 'deliver-order') return `Se entregó el pedido ${targetName}`;
  if (action === 'change_password') return `Se actualizó la contraseña de la cuenta`;

  const cleanAction = action.replace(/-/g, ' ');
  return `Se realizó ${cleanAction} en ${targetName || entity}`;
}

function getTagInfo(log: AdminActivityLog): { label: string; bg: string; color: string } {
  const action = (log.action || '').toLowerCase().trim();
  const entity = (log.entity || '').toLowerCase().trim();

  if (action === 'create' || action === 'crear') {
    return { label: 'Creación', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
  }
  if (action === 'delete' || action === 'eliminar') {
    return { label: 'Eliminación', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
  }
  if (action === 'edit' || action === 'editar' || action === 'update' || action === 'update-status') {
    return { label: 'Edición', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
  }
  if (entity === 'order' || entity === 'orders' || action.includes('order') || action.includes('dispatch') || action.includes('deliver')) {
    return { label: 'Pedido', bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
  }
  if (entity === 'user' || entity === 'users' || action.includes('password') || action.includes('auth')) {
    return { label: 'Seguridad', bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' };
  }
  return { label: 'Sistema', bg: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af' };
}

function timeAgo(timestamp: string): string {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return new Date(timestamp).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const FILTER_OPTIONS = [
  { label: 'Todos', value: 'all' },
  { label: 'Creaciones', value: 'create' },
  { label: 'Ediciones', value: 'edit' },
  { label: 'Eliminaciones', value: 'delete' },
  { label: 'Pedidos', value: 'order' },
  { label: 'Seguridad', value: 'user' },
];

interface ActivityFeedProps {
  pollInterval?: number;
  maxEvents?: number;
}

export function ActivityFeed({
  pollInterval = 10000,
  maxEvents = 100,
}: ActivityFeedProps) {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isViewMoreModalOpen, setIsViewMoreModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const fresh = await getAdminActivityLogs();
      setLogs(fresh.slice(0, maxEvents));
    } catch (error) {
      console.error('Error al obtener los logs de actividad:', error);
    }
  }, [maxEvents]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, pollInterval);
    return () => clearInterval(interval);
  }, [fetchLogs, pollInterval]);

  const handleClearAll = async () => {
    setIsDeleting(true);
    try {
      await clearAdminActivityLogs();
      setLogs([]);
      setIsClearModalOpen(false);
      toast.success('Historial de actividad vaciado');
    } catch {
      toast.error('Error al vaciar el historial');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteRow = async (log: AdminActivityLog) => {
    if (!log.id) return;
    try {
      await deleteAdminActivityLog(log.id);
      setLogs(prev => prev.filter(l => l.id !== log.id));
      toast.success('Registro eliminado');
    } catch {
      toast.error('Error al eliminar el registro');
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (filter === 'all') return true;
      const action = (l.action || '').toLowerCase();
      const entity = (l.entity || '').toLowerCase();

      if (filter === 'create') return action.includes('create') || action.includes('crear');
      if (filter === 'edit') return action.includes('edit') || action.includes('update');
      if (filter === 'delete') return action.includes('delete') || action.includes('eliminar');
      if (filter === 'order') return entity.includes('order') || action.includes('order');
      if (filter === 'user') return entity.includes('user') || action.includes('password');

      return true;
    });
  }, [logs, filter]);

  const displayedLogs = useMemo(() => {
    return filteredLogs.slice(0, DISPLAY_LIMIT);
  }, [filteredLogs]);

  const modalFilteredLogs = useMemo(() => {
    if (!modalSearch.trim()) return filteredLogs;
    const q = modalSearch.toLowerCase().trim();
    return filteredLogs.filter(l =>
      formatActivityDescription(l).toLowerCase().includes(q) ||
      (l.user || '').toLowerCase().includes(q)
    );
  }, [filteredLogs, modalSearch]);

  return (
    <div className="af-wrapper">
      {/* Top Bar con Filtros e Indicador En Vivo */}
      <div className="af-top-bar">
        <div className="af-filter-bar" role="tablist" aria-label="Filtros de actividad">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`af-filter-btn${filter === f.value ? ' active' : ''}`}
              onClick={() => setFilter(f.value)}
              role="tab"
              aria-selected={filter === f.value}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="af-top-actions">
          <button
            type="button"
            className="af-btn-clear"
            onClick={() => setIsClearModalOpen(true)}
            disabled={logs.length === 0}
          >
            Limpiar todo
          </button>
          <span className="af-live-badge" aria-live="polite">
            <span className="af-live-dot" />
            En vivo
          </span>
        </div>
      </div>

      {/* Tabla Escritorio (>= 768px) */}
      <div className="af-table-scroll af-desktop-only">
        {displayedLogs.length === 0 ? (
          <div className="af-empty">Sin actividad reciente registrada.</div>
        ) : (
          <table className="af-table">
            <thead className="af-table-header">
              <tr className="af-table-tr">
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Usuario</th>
                <th>Tiempo</th>
                <th className="af-th-action">Acción</th>
              </tr>
            </thead>
            <tbody>
              {displayedLogs.map((log, i) => {
                const tag = getTagInfo(log);
                return (
                  <tr key={log.id || `${log.timestamp}-${i}`} className="af-row">
                    <td className="af-td-tag">
                      <span
                        className="af-tag"
                        style={{ backgroundColor: tag.bg, color: tag.color }}
                      >
                        {tag.label}
                      </span>
                    </td>
                    <td className="af-desc">{formatActivityDescription(log)}</td>
                    <td className="af-user">{log.user || '—'}</td>
                    <td className="af-time">{timeAgo(log.timestamp)}</td>
                    <td className="af-td-action">
                      <button
                        type="button"
                        className="af-delete-btn"
                        onClick={() => handleDeleteRow(log)}
                        title="Eliminar registro"
                      >
                        <Trash2 size={14} />
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
        {displayedLogs.length === 0 ? (
          <div className="af-empty">Sin actividad reciente registrada.</div>
        ) : (
          displayedLogs.map((log, i) => {
            const tag = getTagInfo(log);
            return (
              <div key={log.id || `${log.timestamp}-${i}`} className="af-mobile-card">
                <div className="af-mobile-card-header">
                  <span
                    className="af-tag"
                    style={{ backgroundColor: tag.bg, color: tag.color }}
                  >
                    {tag.label}
                  </span>
                  <span className="af-mobile-time">{timeAgo(log.timestamp)}</span>
                </div>
                <p className="af-mobile-desc">{formatActivityDescription(log)}</p>
                <div className="af-mobile-card-footer">
                  <span className="af-mobile-user">{log.user || 'desconocido'}</span>
                  <button
                    type="button"
                    className="af-delete-btn-mobile"
                    onClick={() => handleDeleteRow(log)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pie de Widget: Muestra total y dispara Modal de Ver Más */}
      {filteredLogs.length > DISPLAY_LIMIT && (
        <div className="af-bottom-bar">
          <span className="af-bottom-info">
            Mostrando 10 de {filteredLogs.length} eventos
          </span>
          <button
            type="button"
            className="af-view-more-btn"
            onClick={() => setIsViewMoreModalOpen(true)}
          >
            <ExternalLink size={14} />
            Ver todos los eventos ({filteredLogs.length})
          </button>
        </div>
      )}

      {/* Modal Completo de Ver Más Auditoría */}
      <Modal
        open={isViewMoreModalOpen}
        onClose={() => setIsViewMoreModalOpen(false)}
        title="Historial de Auditoría y Actividad"
        size="lg"
        showCloseButton
      >
        <div className="af-modal-body">
          <div className="af-modal-search">
            <Search size={16} className="af-modal-search-icon" />
            <input
              type="search"
              placeholder="Buscar en el historial completo..."
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              className="af-modal-search-input"
            />
          </div>

          <div className="af-modal-table-wrap">
            <table className="af-table">
              <thead className="af-table-header">
                <tr className="af-table-tr">
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Usuario</th>
                  <th>Tiempo</th>
                  <th className="af-th-action">Acción</th>
                </tr>
              </thead>
              <tbody>
                {modalFilteredLogs.map((log, i) => {
                  const tag = getTagInfo(log);
                  return (
                    <tr key={log.id || `modal-${i}`} className="af-row">
                      <td className="af-td-tag">
                        <span className="af-tag" style={{ backgroundColor: tag.bg, color: tag.color }}>
                          {tag.label}
                        </span>
                      </td>
                      <td className="af-desc">{formatActivityDescription(log)}</td>
                      <td className="af-user">{log.user || '—'}</td>
                      <td className="af-time">{timeAgo(log.timestamp)}</td>
                      <td className="af-td-action">
                        <button
                          type="button"
                          className="af-delete-btn"
                          onClick={() => handleDeleteRow(log)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmación para Limpiar Todo */}
      <ModalConfirm
        open={isClearModalOpen}
        title="Vaciar actividad reciente"
        message="¿Estás seguro de que querés vaciar todo el historial de actividad? Esta acción no se puede deshacer."
        confirmText={isDeleting ? 'Vaciando...' : 'Vaciar todo'}
        cancelText="Cancelar"
        onConfirm={handleClearAll}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </div>
  );
}