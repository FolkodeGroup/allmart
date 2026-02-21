import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AdminAuthContextType {
  token: string | null;
  user: string | null;
  login: (user: string, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const STORAGE_KEY = 'allmart_admin_token';
const USER_KEY = 'allmart_admin_user';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState<string | null>(() => localStorage.getItem(USER_KEY));

  const login = (u: string, t: string) => {
    setToken(t);
    setUser(u);
    localStorage.setItem(STORAGE_KEY, t);
    localStorage.setItem(USER_KEY, u);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AdminAuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth debe usarse dentro de AdminAuthProvider');
  return ctx;
}
