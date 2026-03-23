import React from 'react';
import type { AdminActivityLog } from '../services/adminActivityLogService';

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

function buildDescription(log: AdminActivityLog): string {
    return [log.action, log.entity, log.entityId ? `#${log.entityId}` : '']
        .filter(Boolean)
        .join(' — ');
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ log, config }) => {
    return (
        <div className="af-event">
            <div className="af-event-icon" style={{ background: config.bg }}>
                {config.icon}
            </div>

            <div className="af-event-body">
                <div className="af-card">
                    <div className="af-card-top">
                        <span className="af-card-name">{log.user}</span>
                        <span
                            className="af-card-time"
                            title={new Date(log.timestamp).toLocaleString('es-AR')}
                        >
                            {timeAgo(log.timestamp)}
                        </span>
                    </div>
                    <div className="af-card-desc">{buildDescription(log)}</div>

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
