import { useEffect, useRef, useCallback } from 'react';

/**
 * Utility to manage scroll position preservation
 * Saves scroll position when navigating and restores on return
 * 
 * Benefits:
 * - Better UX when navigating between pages
 * - Works with filters, sorting, and pagination
 * - Smooth scroll restoration
 */

interface ScrollMemory {
    [key: string]: number;
}

class TableScrollPreserver {
    private scrollPositions: ScrollMemory = {};

    /**
     * Save current scroll position with a key
     * @param key - Unique identifier for the scroll position
     * @param containerElement - Element to get scroll position from
     */
    saveScroll(key: string, containerElement?: Element) {
        if (containerElement) {
            this.scrollPositions[key] = containerElement.scrollTop;
        } else {
            this.scrollPositions[key] = window.scrollY;
        }
    }

    /**
     * Restore saved scroll position
     * @param key - Key of the saved position
     * @param containerElement - Element to restore scroll to
     * @param smooth - Whether to use smooth scroll
     */
    restoreScroll(key: string, containerElement?: Element, smooth = true) {
        const position = this.scrollPositions[key] ?? 0;
        const behavior = smooth ? 'smooth' : 'auto';

        if (containerElement) {
            containerElement.scrollTo({ top: position, behavior: behavior as ScrollBehavior });
        } else {
            window.scrollTo({ top: position, behavior: behavior as ScrollBehavior });
        }
    }

    /**
     * Clear saved position
     * @param key - Key to clear
     */
    clearScroll(key: string) {
        delete this.scrollPositions[key];
    }

    /**
     * Clear all saved positions
     */
    clearAll() {
        this.scrollPositions = {};
    }
}

// Singleton instance
const preserver = new TableScrollPreserver();

/**
 * Hook to integrate scroll preservation into components
 * 
 * Usage:
 * ```tsx
 * const tableRef = useRef<HTMLDivElement>(null);
 * useScrollPreserver(tableRef, 'products-table', [search, page]);
 * ```
 */
export function useScrollPreserver(
    containerRef: React.RefObject<HTMLElement>,
    key: string,
    deps: readonly unknown[] = []
) {
    const isFirstRender = useRef(true);
    const savedRef = useRef<HTMLElement | null>(null);

    // Save scroll on unmount
    useEffect(() => {
        savedRef.current = containerRef.current;
        return () => {
            if (savedRef.current) {
                preserver.saveScroll(key, savedRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    // Restore scroll on dependencies change
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        // Use requestAnimationFrame to ensure DOM has updated
        const timeoutId = setTimeout(() => {
            if (containerRef.current) {
                preserver.restoreScroll(key, containerRef.current, true);
            }
        }, 0);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

/**
 * Manual scroll management
 */
export const useTableScroll = () => {
    const saveScroll = useCallback((key: string, container?: Element) => {
        preserver.saveScroll(key, container);
    }, []);

    const restoreScroll = useCallback((key: string, container?: Element, smooth = true) => {
        preserver.restoreScroll(key, container, smooth);
    }, []);

    const clearScroll = useCallback((key: string) => {
        preserver.clearScroll(key);
    }, []);

    return { saveScroll, restoreScroll, clearScroll };
};

/**
 * Export preserver for advanced use cases
 */
export { preserver as TableScrollPreserverInstance };
