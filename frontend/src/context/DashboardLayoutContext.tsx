/**
 * context/DashboardLayoutContext.tsx
 * 
 * Context for managing dashboard widget layout and personalization.
 * Handles widget order persistence across sessions.
 * 
 * Future: Can be easily migrated to backend storage by updating the service layer.
 */

import {
    createContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react';
import { dashboardLayoutService } from '../services/dashboardLayoutService';

export type WidgetId =
    | 'metrics'
    | 'charts'
    | 'activity_feed'
    | 'critical_stock'
    | 'recent_orders'
    | 'quick_access'
    | 'staff_notes';

export interface Widget {
    id: WidgetId;
    order: number;
    enabled: boolean;
}

interface DashboardLayoutContextType {
    widgets: Widget[];
    isLoading: boolean;
    reorderWidgets: (widgetOrder: WidgetId[]) => Promise<void>;
    toggleWidget: (widgetId: WidgetId) => Promise<void>;
    resetLayout: () => Promise<void>;
}

const DashboardLayoutContext = createContext<
    DashboardLayoutContextType | undefined
>(undefined);

export { DashboardLayoutContext };

const DEFAULT_WIDGETS: Widget[] = [
    { id: 'quick_access', order: 0, enabled: true },
    { id: 'activity_feed', order: 1, enabled: true },
    { id: 'critical_stock', order: 2, enabled: true },
    { id: 'staff_notes', order: 3, enabled: true },
    { id: 'metrics', order: 4, enabled: true },
    { id: 'charts', order: 5, enabled: true },
    { id: 'recent_orders', order: 6, enabled: true },
];

export function DashboardLayoutProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
    const [isLoading, setIsLoading] = useState(true);

    // Load layout from storage on mount
    useEffect(() => {
        const loadLayout = async () => {
            try {
                setIsLoading(true);
                const savedLayout = await dashboardLayoutService.loadLayout();
                setWidgets(savedLayout || DEFAULT_WIDGETS);
            } catch (error) {
                console.error('Failed to load dashboard layout:', error);
                setWidgets(DEFAULT_WIDGETS);
            } finally {
                setIsLoading(false);
            }
        };

        loadLayout();
    }, []);

    const reorderWidgets = useCallback(
        async (widgetOrder: WidgetId[]) => {
            try {
                // Optimistic update
                const newWidgets = widgetOrder.map((id, index) => ({
                    ...widgets.find((w) => w.id === id) || { id, enabled: true },
                    order: index,
                }));
                setWidgets(newWidgets);

                // Persist to storage
                await dashboardLayoutService.saveLayout(newWidgets);
            } catch (error) {
                console.error('Failed to reorder widgets:', error);
                // Revert on error
                const reloadedLayout = await dashboardLayoutService.loadLayout();
                setWidgets(reloadedLayout || DEFAULT_WIDGETS);
            }
        },
        [widgets],
    );

    const toggleWidget = useCallback(
        async (widgetId: WidgetId) => {
            try {
                const newWidgets = widgets.map((w) =>
                    w.id === widgetId ? { ...w, enabled: !w.enabled } : w,
                );
                setWidgets(newWidgets);

                // Persist to storage
                await dashboardLayoutService.saveLayout(newWidgets);
            } catch (error) {
                console.error('Failed to toggle widget:', error);
                // Revert on error
                const reloadedLayout = await dashboardLayoutService.loadLayout();
                setWidgets(reloadedLayout || DEFAULT_WIDGETS);
            }
        },
        [widgets],
    );

    const resetLayout = useCallback(async () => {
        try {
            setWidgets(DEFAULT_WIDGETS);
            await dashboardLayoutService.resetLayout();
        } catch (error) {
            console.error('Failed to reset layout:', error);
            // Reload from storage on error
            const reloadedLayout = await dashboardLayoutService.loadLayout();
            setWidgets(reloadedLayout || DEFAULT_WIDGETS);
        }
    }, []);

    const value: DashboardLayoutContextType = {
        widgets,
        isLoading,
        reorderWidgets,
        toggleWidget,
        resetLayout,
    };

    return (
        <DashboardLayoutContext.Provider value={value}>
            {children}
        </DashboardLayoutContext.Provider>
    );
}
