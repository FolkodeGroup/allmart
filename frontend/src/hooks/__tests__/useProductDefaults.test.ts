import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductDefaults } from '../useProductDefaults';

// Mock localStorage
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

describe('useProductDefaults', () => {
  it('debería cargar desde localStorage al montar', () => {
    const mockData = {
      version: 1,
      defaults: {
        'cat-1': {
          categoryId: 'cat-1',
          stock: 10,
          visible: true,
          currency: 'ARS',
          lastUsed: Date.now(),
        },
      },
    };

    localStorage.setItem('allmart_product_defaults', JSON.stringify(mockData));

    const { result } = renderHook(() => useProductDefaults());

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.defaults['cat-1']).toBeDefined();
    expect(result.current.defaults['cat-1'].stock).toBe(10);
  });

  it('debería obtener defaults por categoría', () => {
    const { result } = renderHook(() => useProductDefaults());

    act(() => {
      result.current.setDefaults('cat-1', {
        stock: 15,
        visible: true,
        currency: 'USD',
      });
    });

    const defaults = result.current.getDefaults('cat-1');
    expect(defaults).toBeDefined();
    expect(defaults?.stock).toBe(15);
  });

  it('debería retornar null si no existen defaults para una categoría', () => {
    const { result } = renderHook(() => useProductDefaults());

    const defaults = result.current.getDefaults('cat-inexistente');
    expect(defaults).toBeNull();
  });

  it('debería obtener los defaults más recientes', () => {
    const { result } = renderHook(() => useProductDefaults());

    act(() => {
      result.current.setDefaults('cat-1', { stock: 10, visible: true, currency: 'ARS' });
    });

    // Esperar un poco para asegurar diferentes timestamps
    vi.useFakeTimers();
    vi.advanceTimersByTime(1000);

    act(() => {
      result.current.setDefaults('cat-2', { stock: 20, visible: false, currency: 'USD' });
    });

    vi.useRealTimers();

    const recent = result.current.getMostRecentDefaults();
    expect(recent).toBeDefined();
    expect(recent?.categoryId).toBe('cat-2');
  });

  it('debería persistir defaults en localStorage', () => {
    const { result } = renderHook(() => useProductDefaults());

    act(() => {
      result.current.setDefaults('cat-1', {
        stock: 25,
        visible: true,
        currency: 'ARS',
      });
    });

    const stored = localStorage.getItem('allmart_product_defaults');
    expect(stored).toBeDefined();

    const parsed = JSON.parse(stored!);
    expect(parsed.defaults['cat-1'].stock).toBe(25);
  });

  it('debería limpiar todos los defaults', () => {
    const { result } = renderHook(() => useProductDefaults());

    act(() => {
      result.current.setDefaults('cat-1', { stock: 10, visible: true, currency: 'ARS' });
      result.current.setDefaults('cat-2', { stock: 20, visible: false, currency: 'USD' });
    });

    expect(Object.keys(result.current.defaults).length).toBe(2);

    act(() => {
      result.current.clearAllDefaults();
    });

    expect(Object.keys(result.current.defaults).length).toBe(0);
    expect(localStorage.getItem('allmart_product_defaults')).toBeNull();
  });

  it('debería limpiar defaults de una categoría específica', () => {
    const { result } = renderHook(() => useProductDefaults());

    act(() => {
      result.current.setDefaults('cat-1', { stock: 10, visible: true, currency: 'ARS' });
      result.current.setDefaults('cat-2', { stock: 20, visible: false, currency: 'USD' });
    });

    act(() => {
      result.current.clearDefaultsByCategory('cat-1');
    });

    expect(result.current.getDefaults('cat-1')).toBeNull();
    expect(result.current.getDefaults('cat-2')).toBeDefined();
  });

  it('debería manejar versiones de storage incorrectas', () => {
    const mockData = {
      version: 999, // Versión diferente
      defaults: { 'cat-1': { categoryId: 'cat-1', stock: 10, visible: true, currency: 'ARS' } },
    };

    localStorage.setItem('allmart_product_defaults', JSON.stringify(mockData));

    const { result } = renderHook(() => useProductDefaults());

    // Debería ignorar los datos de versión incorrecta
    expect(result.current.defaults).toEqual({});
  });

  it('debería manejar JSON inválido en localStorage', () => {
    localStorage.setItem('allmart_product_defaults', 'invalid json {');

    const { result } = renderHook(() => useProductDefaults());

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.defaults).toEqual({});
  });
});
