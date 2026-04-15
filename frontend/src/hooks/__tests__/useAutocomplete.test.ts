import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutocomplete } from '../useAutocomplete';

describe('useAutocomplete', () => {
  it('debería inicializar con estado vacío', () => {
    const { result } = renderHook(() =>
      useAutocomplete({
        suggestions: ['Apple', 'Banana', 'Orange'],
      })
    );

    expect(result.current.query).toBe('');
    expect(result.current.filteredSuggestions).toEqual([]);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.isSearching).toBe(false);
  });

  it('debería filtrar sugerencias cuando se cambia el query', async () => {
    const { result } = renderHook(() =>
      useAutocomplete({
        suggestions: ['Apple', 'Application', 'Banana', 'Orange'],
        debounceDelay: 0,
      })
    );

    act(() => {
      result.current.setQuery('app');
    });

    // Esperar a que se ejecute el debounce
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(result.current.filteredSuggestions).toContain('Apple');
    expect(result.current.filteredSuggestions).toContain('Application');
  });

  it('debería respetar minInputLength', async () => {
    const { result } = renderHook(() =>
      useAutocomplete({
        suggestions: ['Apple', 'Banana'],
        minInputLength: 3,
        debounceDelay: 0,
      })
    );

    act(() => {
      result.current.setQuery('ap');
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(result.current.filteredSuggestions).toHaveLength(0);

    act(() => {
      result.current.setQuery('app');
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(result.current.filteredSuggestions.length).toBeGreaterThan(0);
  });

  it('debería abrir y cerrar sugerencias', () => {
    const { result } = renderHook(() =>
      useAutocomplete({
        suggestions: ['Apple', 'Banana'],
      })
    );

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.openSuggestions();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeSuggestions();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('debería toggle sugerencias', () => {
    const { result } = renderHook(() =>
      useAutocomplete({
        suggestions: ['Apple', 'Banana'],
      })
    );

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.toggleSuggestions();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.toggleSuggestions();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('debería seleccionar una sugerencia', () => {
    const { result } = renderHook(() =>
      useAutocomplete({
        suggestions: ['Apple', 'Banana'],
      })
    );

    act(() => {
      result.current.selectSuggestion('Apple');
    });

    expect(result.current.query).toBe('Apple');
    expect(result.current.isOpen).toBe(false);
  });

  it('debería limpiar el query', () => {
    const { result } = renderHook(() =>
      useAutocomplete({
        suggestions: ['Apple', 'Banana'],
      })
    );

    act(() => {
      result.current.setQuery('Apple');
    });

    expect(result.current.query).toBe('Apple');

    act(() => {
      result.current.clearQuery();
    });

    expect(result.current.query).toBe('');
    expect(result.current.filteredSuggestions).toEqual([]);
  });

  it('debería resetear completamente el autocompletado', () => {
    const { result } = renderHook(() =>
      useAutocomplete({
        suggestions: ['Apple', 'Banana'],
      })
    );

    act(() => {
      result.current.setQuery('Apple');
      result.current.openSuggestions();
    });

    expect(result.current.query).toBe('Apple');
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.resetAutocomplete();
    });

    expect(result.current.query).toBe('');
    expect(result.current.isOpen).toBe(false);
    expect(result.current.filteredSuggestions).toEqual([]);
  });

  it('debería llamar onSearch personalizado', async () => {
    const mockSearch = vi.fn().mockResolvedValue(['Custom Result 1', 'Custom Result 2']);

    const { result } = renderHook(() =>
      useAutocomplete({
        suggestions: ['Apple', 'Banana'],
        debounceDelay: 0,
        onSearch: mockSearch,
      })
    );

    act(() => {
      result.current.setQuery('test');
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockSearch).toHaveBeenCalledWith('test');
    expect(result.current.filteredSuggestions).toContain('Custom Result 1');
  });

  it('debería manejar errores en onSearch', async () => {
    const mockSearch = vi.fn().mockRejectedValue(new Error('Search error'));

    const { result } = renderHook(() =>
      useAutocomplete({
        suggestions: ['Apple', 'Banana'],
        debounceDelay: 0,
        onSearch: mockSearch,
      })
    );

    act(() => {
      result.current.setQuery('test');
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(result.current.filteredSuggestions).toEqual([]);
  });

  it('debería respetar el límite de sugerencias', async () => {
    const { result } = renderHook(() =>
      useAutocomplete({
        suggestions: Array.from({ length: 20 }, (_, i) => `Item ${i}`),
        maxSuggestions: 5,
        debounceDelay: 0,
      })
    );

    act(() => {
      result.current.setQuery('Item');
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(result.current.filteredSuggestions.length).toBeLessThanOrEqual(5);
  });

  it('debería sanitizar el input', async () => {
    const { result } = renderHook(() =>
      useAutocomplete({
        suggestions: ['apple', 'application'],
        debounceDelay: 0,
      })
    );

    act(() => {
      result.current.setQuery('  APPLE  ');
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(result.current.filteredSuggestions).toContain('apple');
  });
});
