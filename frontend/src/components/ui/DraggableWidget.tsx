/**
 * components/ui/DraggableWidget.tsx
 *
 * Wrapper component for dashboard widgets with drag & drop support.
 * Handles drag state, visual feedback, and accessibility.
 *
 * Usage:
 * <DraggableWidget
 *   id="widget-id"
 *   isDragging={dragState.isDragging}
 *   isDraggedOver={dragState.dragOverId === 'widget-id'}
 *   onDragStart={handlers.handleDragStart}
 *   onDragOver={handlers.handleDragOver}
 *   onDragLeave={handlers.handleDragLeave}
 *   onDrop={handlers.handleDrop}
 *   onDragEnd={handlers.handleDragEnd}
 * >
 *   Content here
 * </DraggableWidget>
 */

import React, { type ReactNode } from 'react';
import type { WidgetId } from '../../context/DashboardLayoutContext';
import styles from './DraggableWidget.module.css';

interface DraggableWidgetProps {
    id: WidgetId;
    isDragging: boolean;
    isDraggedOver: boolean;
    isBeingDragged: boolean;
    onDragStart: (e: React.DragEvent<HTMLElement>, id: WidgetId) => void;
    onDragOver: (e: React.DragEvent<HTMLElement>, id: WidgetId) => void;
    onDragLeave: (e: React.DragEvent<HTMLElement>) => void;
    onDrop: (e: React.DragEvent<HTMLElement>, id: WidgetId) => void;
    onDragEnd: (e: React.DragEvent<HTMLElement>) => void;
    children: ReactNode;
    className?: string;
}

export const DraggableWidget = React.forwardRef<
    HTMLDivElement,
    DraggableWidgetProps
>(
    (
        {
            id,
            isDragging,
            isDraggedOver,
            isBeingDragged,
            onDragStart,
            onDragOver,
            onDragLeave,
            onDrop,
            onDragEnd,
            children,
            className = '',
        },
        ref,
    ) => {
        return (
            <div
                ref={ref}
                draggable={true}
                onDragStart={(e) => onDragStart(e, id)}
                onDragOver={(e) => onDragOver(e, id)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, id)}
                onDragEnd={onDragEnd}
                className={`${styles.widget} ${isDragging ? styles.draggingActive : ''
                    } ${isBeingDragged ? styles.beingDragged : ''} ${isDraggedOver ? styles.draggedOver : ''
                    } ${className}`}
                // Accessibility attributes
                role="button"
                tabIndex={0}
                aria-grabbed={isBeingDragged}
                aria-dropeffect={isDragging && !isBeingDragged ? 'move' : 'none'}
                // Data attributes for testing and styling
                data-widget-id={id}
                data-dragging={isBeingDragged}
            >
                {/* Drag Handle */}
                <div
                    className={styles.dragHandle}
                    title="Arrastra para reordenar"
                    aria-label={`Arrastra para reordenar widget: ${id}`}
                >
                    <span className={styles.dragIcon}>⋮⋮</span>
                </div>

                {/* Widget Content */}
                <div className={styles.widgetContent}>{children}</div>
            </div>
        );
    },
);

DraggableWidget.displayName = 'DraggableWidget';
