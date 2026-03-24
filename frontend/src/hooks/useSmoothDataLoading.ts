import { useState, useEffect, useRef } from 'react';

/**
 * Simple hook to prevent loading skeleton from flashing on fast operations
 * Useful for pagination and data updates that complete quickly
 * 
 * @param data - Current data
 * @param isLoadingProp - Loading state from external source
 * @param options - Configuration options
 * @returns Object with data and smooth loading state
 * 
 * @example
 * const { isLoading: displayLoading } = useSmoothDataLoading(products, isLoadingFromAPI);
 */
export function useSmoothDataLoading<T>(
    data: T,
    isLoadingProp: boolean,
    options: { minShowTime?: number; showDelay?: number } = {}
) {
    const { minShowTime = 200, showDelay = 150 } = options;
    const [displayLoading, setDisplayLoading] = useState(false);
    const delayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const minTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isLoadingProp) {
            // Delay showing loading to prevent flashing on fast operations
            delayTimeoutRef.current = setTimeout(() => {
                setDisplayLoading(true);
            }, showDelay);
        } else if (displayLoading) {
            // Keep showing loading for minimum time for better UX
            minTimeoutRef.current = setTimeout(() => {
                setDisplayLoading(false);
            }, minShowTime);
        }

        return () => {
            if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
            if (minTimeoutRef.current) clearTimeout(minTimeoutRef.current);
        };
    }, [isLoadingProp, displayLoading, minShowTime, showDelay]);

    return {
        data,
        isLoading: displayLoading,
        shouldShowSkeleton: displayLoading && isLoadingProp,
    };
}
