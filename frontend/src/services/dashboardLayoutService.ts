/**
 * services/dashboardLayoutService.ts
 *
 * Service for managing dashboard layout persistence.
 * Uses localStorage as the default storage layer.
 *
 * UPGRADE PATH: Replace with backend API calls by updating this service:
 * - POST /api/admin/user-preferences/dashboard-layout
 * - GET /api/admin/user-preferences/dashboard-layout
 * - DELETE /api/admin/user-preferences/dashboard-layout
 *
 * Example backend implementation:
 * const response = await apiFetch('/api/admin/user-preferences/dashboard-layout', {
 *   method: 'POST',
 *   body: JSON.stringify(layout)
 * });
 */

import type { Widget } from '../context/DashboardLayoutContext';

const STORAGE_KEY = 'allmart_dashboard_layout';

export const dashboardLayoutService = {
    /**
     * Load dashboard layout from storage.
     * Returns null if no saved layout exists (will use defaults).
     */
    async loadLayout(): Promise<Widget[] | null> {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return null;
            return JSON.parse(stored) as Widget[];
        } catch (error) {
            console.error('Error loading dashboard layout:', error);
            return null;
        }
    },

    /**
     * Save dashboard layout to storage.
     * Validates layout before saving to prevent corruption.
     */
    async saveLayout(layout: Widget[]): Promise<void> {
        try {
            // Validate layout structure
            if (!Array.isArray(layout)) {
                throw new Error('Layout must be an array');
            }

            // Check for required fields
            for (const widget of layout) {
                if (!widget.id || typeof widget.order !== 'number') {
                    throw new Error('Invalid widget structure');
                }
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
        } catch (error) {
            console.error('Error saving dashboard layout:', error);
            throw error;
        }
    },

    /**
     * Reset layout to defaults by removing from storage.
     */
    async resetLayout(): Promise<void> {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Error resetting dashboard layout:', error);
            throw error;
        }
    },

    /**
     * Export layout configuration for backup/sharing.
     */
    async exportLayout(): Promise<string> {
        try {
            const layout = await this.loadLayout();
            return JSON.stringify(layout, null, 2);
        } catch (error) {
            console.error('Error exporting dashboard layout:', error);
            throw error;
        }
    },

    /**
     * Import layout configuration from JSON string.
     */
    async importLayout(jsonString: string): Promise<void> {
        try {
            const layout = JSON.parse(jsonString) as Widget[];
            await this.saveLayout(layout);
        } catch (error) {
            console.error('Error importing dashboard layout:', error);
            throw error;
        }
    },
};
