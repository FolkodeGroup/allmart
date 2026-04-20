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
    | 'staff_notes'
    | 'weekly_sales'
    | 'sales_heatmap';

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

const ALL_WIDGET_IDS: WidgetId[] = [
    'metrics',
    'critical_stock',
    'quick_access',
    'activity_feed',
    'staff_notes',
    'charts',
    'recent_orders',
    'weekly_sales',
    'sales_heatmap',
];

const REGRESSED_WIDGET_ORDER: WidgetId[] = [
    'quick_access',
    'activity_feed',
    'critical_stock',
    'staff_notes',
    'metrics',
    'charts',
    'recent_orders',
];

const REGRESSED_WIDGET_ORDER_LEGACY: WidgetId[] = [
    'quick_access',
    'activity_feed',
    'critical_stock',
    'metrics',
    'charts',
    'recent_orders',
];

const DEFAULT_WIDGETS: Widget[] = ALL_WIDGET_IDS.map((id, order) => ({
    id,
    order,
    enabled: true,
}));

function areOrdersEqual(a: WidgetId[], b: WidgetId[]) {
    if (a.length !== b.length) return false;
    return a.every((id, index) => id === b[index]);
}

function normalizeLayout(layout: Widget[] | null): Widget[] {
    if (!layout || !Array.isArray(layout) || layout.length === 0) {
        return DEFAULT_WIDGETS;
    }

    const validWidgets = layout.filter((widget): widget is Widget => {
        return ALL_WIDGET_IDS.includes(widget.id);
    });

    if (validWidgets.length === 0) {
        return DEFAULT_WIDGETS;
    }

    const sortedSaved = [...validWidgets].sort((a, b) => a.order - b.order);
    const savedOrder = sortedSaved.map((widget) => widget.id);

    if (
        areOrdersEqual(savedOrder, REGRESSED_WIDGET_ORDER) ||
        areOrdersEqual(savedOrder, REGRESSED_WIDGET_ORDER_LEGACY)
    ) {
        return DEFAULT_WIDGETS;
    }

    const savedWidgetMap = new Map(sortedSaved.map((widget) => [widget.id, widget]));
    const mergedOrder: WidgetId[] = [
        ...savedOrder,
        ...ALL_WIDGET_IDS.filter((id) => !savedWidgetMap.has(id)),
    ];

    return mergedOrder.map((id, order) => ({
        id,
        order,
        enabled: savedWidgetMap.get(id)?.enabled ?? true,
    }));
}

function areLayoutsEqual(a: Widget[] | null, b: Widget[]) {
    if (!a || a.length !== b.length) return false;

    const aSorted = [...a].sort((x, y) => x.order - y.order);
    const bSorted = [...b].sort((x, y) => x.order - y.order);

    return aSorted.every((widget, index) => {
        const other = bSorted[index];
        return (
            widget.id === other.id &&
            widget.order === other.order &&
            widget.enabled === other.enabled
        );
    });
}

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
                const normalizedLayout = normalizeLayout(savedLayout);

                setWidgets(normalizedLayout);

                // Persist migrated layouts only when the stored value differs.
                if (!areLayoutsEqual(savedLayout, normalizedLayout)) {
                    await dashboardLayoutService.saveLayout(normalizedLayout);
                }
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
