import { createContext } from 'react';

interface SidebarContextType {
  isMobile: boolean;
  isOpen: boolean;
  toggleOpen: () => void;
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);