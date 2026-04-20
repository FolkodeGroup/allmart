import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { type Role, type Permission, hasPermission } from '../utils/permissions';

interface AdminAuthContextType {
  token: string | null;
  user: string | null;
  role: Role | null;
  isReady: boolean;
  login: (user: string, token: string, role: Role) => void;
  logout: () => void;
  isAuthenticated: boolean;
  can: (permission: Permission) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const STORAGE_KEY = 'allmart_admin_token';
const USER_KEY = 'allmart_admin_user';
const ROLE_KEY = 'allmart_admin_role';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    const storedRole = localStorage.getItem(ROLE_KEY);

    setToken(storedToken);
    setUser(storedUser);
    setRole(storedRole === 'admin' || storedRole === 'editor' ? storedRole : null);
    setIsReady(true);
  }, []);

  const login = (u: string, t: string, r: Role) => {
    setToken(t);
    setUser(u);
    setRole(r);
    localStorage.setItem(STORAGE_KEY, t);
    localStorage.setItem(USER_KEY, u);
    localStorage.setItem(ROLE_KEY, r);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setRole(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn('Sesión expirada detectada por el API handler. Cerrando sesión.');
      logout();
    };
    
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  const can = (permission: Permission) => hasPermission(role, permission);

  return (
    <AdminAuthContext.Provider value={{ token, user, role, isReady, login, logout, isAuthenticated: !!token, can }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth debe usarse dentro de AdminAuthProvider');
  return ctx;
}
