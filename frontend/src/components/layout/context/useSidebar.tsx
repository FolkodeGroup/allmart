import { useContext } from 'react';
import { SidebarContext } from './SidebarContextInstance'; // Asegúrate de exportar SidebarContext en el otro archivo


// Hook para usar el contexto fácilmente
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar debe usarse dentro de SidebarProvider');
  return context;
};