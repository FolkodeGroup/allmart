/**
 * hooks/useDashboardLayout.ts
 *
 * Hook for accessing dashboard layout context.
 * Separated from context for React fast refresh compatibility.
 */

import { useContext } from 'react';
import { DashboardLayoutContext } from '../context/DashboardLayoutContext';

export function useDashboardLayout() {
    const ctx = useContext(DashboardLayoutContext);
    if (!ctx) {
        throw new Error(
            'useDashboardLayout must be used within DashboardLayoutProvider',
        );
    }
    return ctx;
}
