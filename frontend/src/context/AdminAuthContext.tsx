import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { type Role, type Permission, hasPermission } from '../utils/permissions';

interface AdminAuthContextType {
  token: string | null;
  user: string | null;
  role: Role | null;
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
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState<string | null>(() => localStorage.getItem(USER_KEY));
  const [role, setRole] = useState<Role | null>(() => {
    const stored = localStorage.getItem(ROLE_KEY);
    return stored === 'admin' || stored === 'editor' ? stored : null;
  });

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

  const can = (permission: Permission) => hasPermission(role, permission);

  return (
    <AdminAuthContext.Provider value={{ token, user, role, login, logout, isAuthenticated: !!token, can }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth debe usarse dentro de AdminAuthProvider');
  return ctx;
}
