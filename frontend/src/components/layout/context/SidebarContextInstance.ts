import { createContext } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
  isOpen: boolean;
  toggleOpen: () => void;
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);