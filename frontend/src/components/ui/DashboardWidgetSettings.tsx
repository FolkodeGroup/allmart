/**
 * components/ui/DashboardWidgetSettings.tsx
 *
 * Settings panel for dashboard personalization.
 * Allows users to toggle widget visibility, reorder widgets, and reset layout.
 *
 * Features:
 * - Toggle widget visibility
 * - Drag-and-drop to reorder widgets
 * - Real-time preview of widget order
 * - Reset layout to defaults
 * - Smooth animations and transitions
 */

import React, { useState, useCallback, useMemo } from 'react';
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
    onReorderWidgets?: (widgetOrder: WidgetId[]) => Promise<void>;
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
            onReorderWidgets,
            isOpen,
            onClose,
        },
        ref,
    ) => {
        const [isResetting, setIsResetting] = useState(false);
        const [draggedId, setDraggedId] = useState<WidgetId | null>(null);
        const [dragOverId, setDragOverId] = useState<WidgetId | null>(null);
        const [localOrder, setLocalOrder] = useState<WidgetInfo[]>(widgets);
        const [showPreview, setShowPreview] = useState(true);

        // Update local order when widgets change
        React.useEffect(() => {
            setLocalOrder(widgets);
        }, [widgets]);

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

        const handleDragStart = useCallback((e: React.DragEvent, id: WidgetId) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', id);
            setDraggedId(id);
        }, []);

        const handleDragOver = useCallback((e: React.DragEvent, id: WidgetId) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverId(id);
        }, []);

        const handleDragLeave = useCallback(() => {
            setDragOverId(null);
        }, []);

        const handleDrop = useCallback(
            async (e: React.DragEvent, targetId: WidgetId) => {
                e.preventDefault();
                if (!draggedId || draggedId === targetId || !onReorderWidgets) {
                    setDraggedId(null);
                    setDragOverId(null);
                    return;
                }

                const newOrder = [...localOrder];
                const draggedIndex = newOrder.findIndex((w) => w.id === draggedId);
                const targetIndex = newOrder.findIndex((w) => w.id === targetId);

                if (draggedIndex !== -1 && targetIndex !== -1) {
                    const [draggedWidget] = newOrder.splice(draggedIndex, 1);
                    newOrder.splice(targetIndex, 0, draggedWidget);
                    setLocalOrder(newOrder);

                    // Persist the new order
                    const widgetOrder = newOrder.map((w) => w.id);
                    try {
                        await onReorderWidgets(widgetOrder);
                    } catch (error) {
                        console.error('Failed to reorder widgets:', error);
                        // Revert on error
                        setLocalOrder(widgets);
                    }
                }

                setDraggedId(null);
                setDragOverId(null);
            },
            [draggedId, localOrder, onReorderWidgets, widgets],
        );

        const handleDragEnd = useCallback(() => {
            setDraggedId(null);
            setDragOverId(null);
        }, []);

        // Compute preview widgets
        const enabledWidgetsPreview = useMemo(
            () => localOrder.filter((w) => w.enabled),
            [localOrder],
        );

        const disabledWidgetsPreview = useMemo(
            () => localOrder.filter((w) => !w.enabled),
            [localOrder],
        );

        // Count active widgets
        const activeCount = localOrder.filter((w) => w.enabled).length;
        const totalCount = localOrder.length;

        if (!isOpen) return null;

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
                        {/* Preview Toggle */}
                        {onReorderWidgets && (
                            <div className={styles.previewToggle}>
                                <label className={styles.toggleLabel}>
                                    <input
                                        type="checkbox"
                                        checked={showPreview}
                                        onChange={(e) => setShowPreview(e.target.checked)}
                                        className={styles.toggle}
                                    />
                                    <span className={styles.checkmark} />
                                    <span className={styles.label}>Mostrar vista previa</span>
                                </label>
                            </div>
                        )}

                        {/* Tabs for organization */}
                        <div className={styles.tabs}>
                            <button
                                className={`${styles.tab} ${!showPreview || !onReorderWidgets ? styles.activeTab : ''}`}
                                onClick={() => setShowPreview(false)}
                                disabled={!onReorderWidgets}
                            >
                                ⚙️ Configurar
                            </button>
                            {onReorderWidgets && (
                                <button
                                    className={`${styles.tab} ${showPreview ? styles.activeTab : ''}`}
                                    onClick={() => setShowPreview(true)}
                                >
                                    👁️ Vista Previa
                                </button>
                            )}
                        </div>

                        {/* Configuration Tab */}
                        {(!showPreview || !onReorderWidgets) && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>
                                    Widgets visibles ({activeCount}/{totalCount})
                                </h3>
                                <ul className={styles.widgetsList}>
                                    {localOrder.map((widget) => (
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
                        )}

                        {/* Preview Tab */}
                        {showPreview && onReorderWidgets && (
                            <div className={styles.previewContainer}>
                                {/* Enabled Widgets Section */}
                                <div className={styles.previewSection}>
                                    <h4 className={styles.previewTitle}>
                                        📺 Widgets Activos ({enabledWidgetsPreview.length})
                                    </h4>
                                    <div className={styles.previewList}>
                                        {enabledWidgetsPreview.length === 0 ? (
                                            <p className={styles.emptyMessage}>
                                                No hay widgets activos. Habilita algunos para verlos aquí.
                                            </p>
                                        ) : (
                                            enabledWidgetsPreview.map((widget) => (
                                                <div
                                                    key={widget.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, widget.id)}
                                                    onDragOver={(e) => handleDragOver(e, widget.id)}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={(e) => handleDrop(e, widget.id)}
                                                    onDragEnd={handleDragEnd}
                                                    className={`${styles.previewWidget} ${
                                                        draggedId === widget.id ? styles.dragging : ''
                                                    } ${dragOverId === widget.id ? styles.dragOver : ''}`}
                                                >
                                                    <span className={styles.dragHandle}>⋮⋮</span>
                                                    <span className={styles.widgetPreviewLabel}>
                                                        {widget.label}
                                                    </span>
                                                    <span className={styles.dragHint}>Arrastra para reordenar</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Disabled Widgets Section */}
                                {disabledWidgetsPreview.length > 0 && (
                                    <div className={styles.previewSection}>
                                        <h4 className={styles.previewTitle}>
                                            🔒 Widgets Inactivos ({disabledWidgetsPreview.length})
                                        </h4>
                                        <div className={styles.disabledWidgetsList}>
                                            {disabledWidgetsPreview.map((widget) => (
                                                <div
                                                    key={widget.id}
                                                    className={styles.disabledWidget}
                                                    title="Habilita este widget en la sección de configuración"
                                                >
                                                    <span className={styles.disabledLabel}>
                                                        {widget.label}
                                                    </span>
                                                    <span className={styles.disabledHint}>Deshabilitado</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Preview Info */}
                                <div className={styles.previewInfo}>
                                    <span className={styles.infoIcon}>ℹ️</span>
                                    <p className={styles.infoText}>
                                        Arrastra los widgets en la sección anterior para cambiar su orden en el panel.
                                    </p>
                                </div>
                            </div>
                        )}

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
                </div>
            </>
        );
    },
);

DashboardWidgetSettings.displayName = 'DashboardWidgetSettings';
