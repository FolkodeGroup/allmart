import React, { useState, useEffect } from 'react';
import { SidebarContext } from './SidebarContextInstance';

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) setIsOpen(false);
  }, [isMobile]);

  const toggleOpen = () => setIsOpen((s) => !s);

  return (
    <SidebarContext.Provider value={{ isMobile, isOpen, toggleOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

