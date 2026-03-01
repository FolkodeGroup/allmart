import { useSidebar } from './useSidebar';

export const Sidebar = () => {
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar();

  // Clases dinámicas: Si es móvil es un Drawer (fixed), si es desktop es colapsable (relative)
  const sidebarClasses = `
    ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
    ${isCollapsed ? 'w-20' : 'w-64'}
    ${isMobile && isCollapsed ? '-translate-x-full' : 'translate-x-0'}
    transition-all duration-300 bg-[#7da18c] text-white flex flex-col shadow-xl
  `;

  return (
    <>
      {/* Backdrop para móviles (Punto 3 de la tarea) */}
      {isMobile && !isCollapsed && (
        <button
          className="fixed inset-0 bg-black/50 z-40 transition-opacity" 
          onClick={toggleSidebar} 
        />
      )}

      <aside className={sidebarClasses}>
        {/* Botón Toggle - Hamburguesa (Punto 1 de la tarea) */}
        <div className="p-4 flex justify-center border-b border-white/20">
          <button onClick={toggleSidebar} className="p-2 hover:bg-white/10 rounded-md">
            <span className="text-2xl">☰</span>
          </button>
        </div>

        {/* Lista de Navegación con Iconos solamente al colapsar */}
        <nav className="flex-1 mt-4 space-y-2">
          <div className="flex items-center p-4 hover:bg-white/10 cursor-pointer overflow-hidden">
            <span className="text-xl min-w-[24px]">🏠</span>
            {(!isCollapsed || isMobile) && <span className="ml-4 font-medium">Inicio</span>}
          </div>
          <div className="flex items-center p-4 hover:bg-white/10 cursor-pointer overflow-hidden">
            <span className="text-xl min-w-[24px]">📦</span>
            {(!isCollapsed || isMobile) && <span className="ml-4 font-medium">Productos</span>}
          </div>
        </nav>
      </aside>
    </>
  );
};