import { createContext } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);