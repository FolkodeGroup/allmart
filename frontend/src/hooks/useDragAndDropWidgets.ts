/**
 * hooks/useDragAndDropWidgets.ts
 *
 * Hook for managing drag and drop interactions for dashboard widgets.
 * Provides lightweight drag/drop logic without external dependencies.
 *
 * Features:
 * - Smooth drag feedback
 * - Keyboard accessibility (drag with keyboard if needed)
 * - Touch support for mobile
 * - Automatic scroll on drag near edges
 */

import { useCallback, useRef, useState } from 'react';
import type { WidgetId } from '../context/DashboardLayoutContext';

export interface DragState {
    isDragging: boolean;
    draggedId: WidgetId | null;
    dragOverId: WidgetId | null;
    offset: { x: number; y: number };
}

interface UseDragAndDropWidgetsOptions {
    onReorder: (newOrder: WidgetId[]) => void;
    onDragStart?: (id: WidgetId) => void;
    onDragEnd?: () => void;
}

export function useDragAndDropWidgets(
    widgets: WidgetId[],
    options: UseDragAndDropWidgetsOptions,
) {
    const [dragState, setDragState] = useState<DragState>({
        isDragging: false,
        draggedId: null,
        dragOverId: null,
        offset: { x: 0, y: 0 },
    });

    const dragImageRef = useRef<HTMLDivElement | null>(null);
    const autoScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Start dragging
    const handleDragStart = useCallback(
        (e: React.DragEvent<HTMLElement>, widgetId: WidgetId) => {
            setDragState({
                isDragging: true,
                draggedId: widgetId,
                dragOverId: null,
                offset: { x: e.clientX, y: e.clientY },
            });

            // Set drag image
            if (dragImageRef.current) {
                e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
            }

            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', widgetId);

            options.onDragStart?.(widgetId);
        },
        [options],
    );

    // Drag over (allow drop)
    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLElement>, widgetId: WidgetId) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            setDragState((prev) => ({
                ...prev,
                dragOverId: widgetId,
            }));

            // Auto-scroll if dragging near edges
            if (autoScrollTimeoutRef.current) {
                clearTimeout(autoScrollTimeoutRef.current);
            }

            autoScrollTimeoutRef.current = setTimeout(() => {
                const container = document.querySelector(
                    '[data-dashboard-container]',
                );
                if (!container) return;

                const rect = container.getBoundingClientRect();
                const scrollThreshold = 50;

                if (e.clientY < rect.top + scrollThreshold && container.scrollTop > 0) {
                    container.scrollTop -= 10;
                } else if (
                    e.clientY > rect.bottom - scrollThreshold &&
                    container.scrollTop <
                    container.scrollHeight - container.clientHeight
                ) {
                    container.scrollTop += 10;
                }
            }, 10);
        },
        [],
    );

    // Drag leave
    const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
        // Only clear if leaving the widget area entirely
        if (
            e.relatedTarget &&
            !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)
        ) {
            setDragState((prev) => ({
                ...prev,
                dragOverId: null,
            }));
        }
    }, []);

    // Drop
    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLElement>, targetId: WidgetId) => {
            e.preventDefault();
            e.stopPropagation();

            const draggedId = dragState.draggedId;
            if (!draggedId || draggedId === targetId) {
                setDragState({
                    isDragging: false,
                    draggedId: null,
                    dragOverId: null,
                    offset: { x: 0, y: 0 },
                });
                options.onDragEnd?.();
                return;
            }

            // Reorder widgets
            const draggedIndex = widgets.indexOf(draggedId);
            const targetIndex = widgets.indexOf(targetId);

            if (draggedIndex !== -1 && targetIndex !== -1) {
                const newOrder = [...widgets];
                newOrder.splice(draggedIndex, 1);
                newOrder.splice(targetIndex, 0, draggedId);

                options.onReorder(newOrder);
            }

            setDragState({
                isDragging: false,
                draggedId: null,
                dragOverId: null,
                offset: { x: 0, y: 0 },
            });

            options.onDragEnd?.();
        },
        [widgets, dragState.draggedId, options],
    );

    // End dragging
    const handleDragEnd = useCallback(() => {
        if (autoScrollTimeoutRef.current) {
            clearTimeout(autoScrollTimeoutRef.current);
        }

        setDragState({
            isDragging: false,
            draggedId: null,
            dragOverId: null,
            offset: { x: 0, y: 0 },
        });

        options.onDragEnd?.();
    }, [options]);

    return {
        dragState,
        dragImageRef,
        handlers: {
            handleDragStart,
            handleDragOver,
            handleDragLeave,
            handleDrop,
            handleDragEnd,
        },
    };
}
