import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import type { ReactNode } from 'react';
import type { Permission } from '../utils/permissions';

interface AdminRouteProps {
  children: ReactNode;
  requiredPermission?: Permission;
}

export function AdminRoute({ children, requiredPermission }: AdminRouteProps) {
  const { isAuthenticated, can } = useAdminAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (requiredPermission && !can(requiredPermission)) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <>{children}</>;
}
