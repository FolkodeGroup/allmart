/**
 * components/ui/DashboardWidgetSettings.tsx
 *
 * Settings panel for dashboard personalization.
 * Allows users to toggle widget visibility and reset layout.
 *
 * Features:
 * - Toggle widget visibility
 * - Reset layout to defaults
 * - Shows active/inactive widgets
 */

import React, { useState } from 'react';
import type { WidgetId } from '../../context/DashboardLayoutContext';
import styles from './DashboardWidgetSettings.module.css';

interface WidgetInfo {
    id: WidgetId;
    label: string;
    enabled: boolean;
}

interface DashboardWidgetSettingsProps {
    widgets: WidgetInfo[];
    onToggleWidget: (id: WidgetId) => Promise<void>;
    onResetLayout: () => Promise<void>;
    isOpen: boolean;
    onClose: () => void;
}

export const DashboardWidgetSettings = React.forwardRef<
    HTMLDivElement,
    DashboardWidgetSettingsProps
>(
    (
        {
            widgets,
            onToggleWidget,
            onResetLayout,
            isOpen,
            onClose,
        },
        ref,
    ) => {
        const [isResetting, setIsResetting] = useState(false);

        const handleResetClick = async () => {
            if (!window.confirm('¿Restaurar el diseño predeterminado del panel?')) {
                return;
            }

            setIsResetting(true);
            try {
                await onResetLayout();
            } finally {
                setIsResetting(false);
            }
        };

        if (!isOpen) return null;

        // Count active widgets
        const activeCount = widgets.filter((w) => w.enabled).length;
        const totalCount = widgets.length;

        return (
            <>
                {/* Backdrop */}
                <div
                    className={styles.backdrop}
                    onClick={onClose}
                    role="presentation"
                    aria-hidden="true"
                />

                {/* Settings Panel */}
                <div
                    ref={ref}
                    className={styles.panel}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="settings-title"
                >
                    <div className={styles.header}>
                        <h2 id="settings-title" className={styles.title}>
                            Personalizar Panel
                        </h2>
                        <button
                            onClick={onClose}
                            className={styles.closeButton}
                            aria-label="Cerrar"
                            title="Cerrar"
                        >
                            ✕
                        </button>
                    </div>

                    <div className={styles.content}>
                        {/* Widgets List */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                Widgets visibles ({activeCount}/{totalCount})
                            </h3>
                            <ul className={styles.widgetsList}>
                                {widgets.map((widget) => (
                                    <li key={widget.id} className={styles.widgetItem}>
                                        <label className={styles.toggleLabel}>
                                            <input
                                                type="checkbox"
                                                checked={widget.enabled}
                                                onChange={() => onToggleWidget(widget.id)}
                                                className={styles.toggle}
                                                aria-label={`${widget.enabled ? 'Ocultar' : 'Mostrar'} ${widget.label}`}
                                            />
                                            <span className={styles.checkmark} />
                                            <span className={styles.label}>{widget.label}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Reset Button */}
                        <div className={styles.section}>
                            <button
                                onClick={handleResetClick}
                                disabled={isResetting}
                                className={styles.resetButton}
                                type="button"
                            >
                                {isResetting ? '⟳ Restaurando...' : '↺ Restaurar diseño predeterminado'}
                            </button>
                            <p className={styles.resetHint}>
                                Esto restaurará todos los widgets a su estado inicial.
                            </p>
                        </div>
                    </div>

                    {/* Drag hint */}
                    <div className={styles.hint}>
                        <span className={styles.hintIcon}>ℹ️</span>
                        <p className={styles.hintText}>
                            Arrastra los widgets para reordenarlos en el panel.
                        </p>
                    </div>
                </div>
            </>
        );
    },
);

DashboardWidgetSettings.displayName = 'DashboardWidgetSettings';
