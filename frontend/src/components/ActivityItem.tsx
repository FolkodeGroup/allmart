import React from 'react';
import type { AdminActivityLog } from '../services/adminActivityLogService';
import { useAdminProducts } from '../context/useAdminProductsContext';
import { useAdminAuth } from '../context/AdminAuthContext';

interface ActivityItemProps {
    log: AdminActivityLog;
    config: {
        icon: string;
        label: string;
        bg: string;
        tagBg: string;
        tagColor: string;
    };
}

function timeAgo(timestamp: string): string {
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    return new Date(timestamp).toLocaleDateString('es-AR');
}

function buildDescription(
    log: AdminActivityLog,
    getProductName: (id: string) => string | undefined
): string {
    // Traducción de acciones
    const actionMap: Record<string, string> = {
        create: 'Creó',
        edit: 'Editó',
        delete: 'Eliminó',
        order: 'Nuevo pedido',
        user: 'Usuario',
        alert: 'Alerta',
    };
    const action = actionMap[log.action?.toLowerCase() || ''] || log.action;
    let entity = '';
    let name = '';
    if (log.entity === 'product' && log.entityId) {
        name = getProductName(log.entityId) || `Producto #${log.entityId}`;
        entity = 'el producto';
    } else if (log.entity === 'category' && log.entityId) {
        name = (log.details?.name as string) || `Categoría #${log.entityId}`;
        entity = 'la categoría';
    } else if (log.entity === 'order' && log.entityId) {
        name = `Pedido #${log.entityId}`;
        entity = 'el pedido';
    } else if (log.entity === 'user' && log.entityId) {
        name = (log.details?.name as string) || `Usuario #${log.entityId}`;
        entity = 'el usuario';
    } else {
        name = (log.details?.name as string) || '';
        entity = log.entity || '';
    }
    if (action === 'Nuevo pedido') {
        return `${action}: ${name}`;
    }
    return [action, entity, name].filter(Boolean).join(' ');
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ log, config }) => {
    const { getProduct } = useAdminProducts();
    const { user: currentUser } = useAdminAuth();
    const getProductName = (id: string) => getProduct(id)?.name;
    // Mostrar el usuario del log, o el usuario actual si coincide, o 'Usuario desconocido'
    let userDisplay = log.user;
    if (!userDisplay || userDisplay === 'desconocido') {
        userDisplay = currentUser || 'Usuario desconocido';
    }
    return (
        <div className="af-event">
            <div className="af-event-icon" style={{ background: config.bg }}>
                {config.icon}
            </div>

            <div className="af-event-body">
                <div className="af-card">
                    <div className="af-card-top">
                        <span className="af-card-name">{userDisplay}</span>
                        <span
                            className="af-card-time"
                            title={new Date(log.timestamp).toLocaleString('es-AR')}
                        >
                            {timeAgo(log.timestamp)}
                        </span>
                    </div>
                    <div className="af-card-desc">{buildDescription(log, getProductName)}</div>

                    <span
                        className="af-tag"
                        style={{ background: config.tagBg, color: config.tagColor }}
                    >
                        {config.label}
                    </span>
                </div>
            </div>
        </div>
    );
};

ActivityItem.displayName = 'ActivityItem';
