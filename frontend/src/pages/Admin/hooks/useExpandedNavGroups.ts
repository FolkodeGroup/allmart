import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  to: string;
  icon: string;
  permission: string | null;
  badge: 'pending' | 'lowStock' | 'outOfStock' | 'unreadContacts' | null;
  children?: NavItem[];
}

function hasActiveChildPath(children: NavItem[], pathname: string): boolean {
  return children.some((child) => {
    if (pathname === child.to || pathname.startsWith(child.to + '/')) return true;
    if (child.children) return hasActiveChildPath(child.children, pathname);
    return false;
  });
}

export function useExpandedNavGroups(navItems: NavItem[]) {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());

  // Auto-expandir grupos que tienen un hijo activo según la ruta actual
  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      navItems.forEach((item) => {
        if (item.children && hasActiveChildPath(item.children, location.pathname)) {
          next.add(item.to);
        }
      });
      return next;
    });
  }, [location.pathname, navItems]);

  const toggleGroup = useCallback((to: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(to)) {
        next.delete(to);
      } else {
        next.add(to);
      }
      return next;
    });
  }, []);

  return { expandedGroups, toggleGroup };
}
