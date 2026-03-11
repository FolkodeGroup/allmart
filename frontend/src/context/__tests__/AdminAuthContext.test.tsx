import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AdminAuthProvider, useAdminAuth } from '../AdminAuthContext';
import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <AdminAuthProvider>{children}</AdminAuthProvider>
);

describe('AdminAuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with null state when localStorage is empty', () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login should set token and role in state and localStorage', () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    
    act(() => {
      result.current.login('admin_user', 'secret_token', 'admin');
    });

    expect(result.current.token).toBe('secret_token');
    expect(result.current.role).toBe('admin');
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('allmart_admin_token')).toBe('secret_token');
  });

  it('logout should clear state and localStorage', () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    
    act(() => {
      result.current.login('admin_user', 'secret_token', 'admin');
    });
    
    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('allmart_admin_token')).toBeNull();
  });

  it('should logout automatically on unauthorized event', () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    
    act(() => {
      result.current.login('admin_user', 'secret_token', 'admin');
    });

    act(() => {
      window.dispatchEvent(new CustomEvent('unauthorized'));
    });

    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
