import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing pagination state and logic
 * Provides: current page, total pages, paginated data, navigation methods
 * 
 * Features:
 * - Type-safe generic typing for data items
 * - Automatic page reset on data changes
 * - Smooth transitions with optional loading states
 * - Maintains consistency with filter updates
 */
export interface UsePaginationOptions {
    itemsPerPage?: number;
    initialPage?: number;
    onPageChange?: (page: number) => void;
}

export interface UsePaginationReturn<T> {
    currentPage: number;
    totalPages: number;
    paginatedData: T[];
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    canNextPage: boolean;
    canPrevPage: boolean;
}

/**
 * Generic pagination hook
 * @param data - Full array of data items to paginate
 * @param options - Configuration options
 * @returns Pagination state and methods
 */
export function usePagination<T>(
    data: T[],
    options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
    const { itemsPerPage = 10, initialPage = 1, onPageChange } = options;
    const [currentPage, setCurrentPage] = useState(initialPage);

    // Reset to page 1 when data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [data]);

    const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

    // Clamp current page to valid range
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const paginatedData = data.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const goToPage = useCallback((page: number) => {
        const validPage = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(validPage);
        onPageChange?.(validPage);
        // Dispatch scroll event for external scroll preservation
        window.dispatchEvent(new CustomEvent('pagination-change', { detail: { page: validPage } }));
    }, [totalPages, onPageChange]);

    const nextPage = useCallback(() => {
        goToPage(currentPage + 1);
    }, [currentPage, goToPage]);

    const prevPage = useCallback(() => {
        goToPage(currentPage - 1);
    }, [currentPage, goToPage]);

    const canNextPage = currentPage < totalPages;
    const canPrevPage = currentPage > 1;

    return {
        currentPage,
        totalPages,
        paginatedData,
        goToPage,
        nextPage,
        prevPage,
        canNextPage,
        canPrevPage,
    };
}
