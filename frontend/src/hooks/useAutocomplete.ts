/**
 * Hook para autocomplete con debounce
 * Gestiona sugerencias, búsqueda y filtrado with debounce
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { debounce, filterSuggestions, sanitizeAutocompleteInput } from '../utils/productFormUtils';

export interface UseAutocompleteOptions {
  suggestions: string[];
  debounceDelay?: number;
  maxSuggestions?: number;
  minInputLength?: number;
  onSearch?: (term: string) => Promise<string[]>;
}

export interface UseAutocompleteReturn {
  query: string;
  setQuery: (value: string) => void;
  filteredSuggestions: string[];
  isSearching: boolean;
  isOpen: boolean;
  openSuggestions: () => void;
  closeSuggestions: () => void;
  toggleSuggestions: () => void;
  selectSuggestion: (suggestion: string) => void;
  clearQuery: () => void;
  resetAutocomplete: () => void;
}

/**
 * Custom hook para gestionar autocomplete con debounce
 * @param options - Opciones de configuración
 * @returns Estado y métodos para gestionar autocomplete
 */
export function useAutocomplete({
  suggestions: initialSuggestions,
  debounceDelay = 300,
  maxSuggestions = 10,
  minInputLength = 1,
  onSearch,
}: UseAutocompleteOptions): UseAutocompleteReturn {
  const [query, setQuery] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search function
  const performSearch = useCallback(
    async (searchTerm: string) => {
      if (searchTerm.length < minInputLength) {
        setFilteredSuggestions([]);
        return;
      }

      setIsSearching(true);

      try {
        let results: string[];

        if (onSearch) {
          // Si existe un callback de búsqueda personalizado, úsalo
          results = await onSearch(searchTerm);
        } else {
          // De lo contrario, filtra desde las sugerencias iniciales
          results = filterSuggestions(searchTerm, initialSuggestions, maxSuggestions);
        }

        setFilteredSuggestions(results);
      } catch (error) {
        console.error('Error during autocomplete search:', error);
        setFilteredSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    },
    [initialSuggestions, maxSuggestions, minInputLength, onSearch]
  );

  // Debounced version of performSearch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(performSearch, debounceDelay),
    [performSearch, debounceDelay]
  );

  // Trigger search cuando el query cambia
  useEffect(() => {
    const sanitized = sanitizeAutocompleteInput(query);
    debouncedSearch(sanitized);
  }, [query, debouncedSearch]);

  const openSuggestions = useCallback(() => setIsOpen(true), []);
  const closeSuggestions = useCallback(() => setIsOpen(false), []);

  const toggleSuggestions = useCallback(
    () => setIsOpen(prev => !prev),
    []
  );

  const selectSuggestion = useCallback((suggestion: string) => {
    setQuery(suggestion);
    closeSuggestions();
  }, [closeSuggestions]);

  const clearQuery = useCallback(() => {
    setQuery('');
    setFilteredSuggestions([]);
  }, []);

  const resetAutocomplete = useCallback(() => {
    clearQuery();
    closeSuggestions();
    setIsSearching(false);
  }, [clearQuery, closeSuggestions]);

  // Cleanup
  useEffect(() => {
    const timeoutId = searchTimeoutRef.current;
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    filteredSuggestions,
    isSearching,
    isOpen,
    openSuggestions,
    closeSuggestions,
    toggleSuggestions,
    selectSuggestion,
    clearQuery,
    resetAutocomplete,
  };
}
