import { useSidebar } from './useSidebar';

export const Sidebar = () => {
  const { isMobile, isOpen, toggleOpen } = useSidebar();

  const mobileTransformClass = isOpen ? 'translate-x-0' : '-translate-x-full';
  const baseClasses = 'transition-all duration-300 bg-[#7da18c] text-white flex flex-col shadow-xl';

  const sidebarClasses = isMobile
    ? `fixed inset-y-0 left-0 z-50 ${mobileTransformClass} w-64 ${baseClasses}`
    : `relative w-64 ${baseClasses}`;

  return (
    <>
      {/* Backdrop para móviles */}
      {isMobile && isOpen && (
        <button
          aria-label="Cerrar menú"
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={toggleOpen}
          tabIndex={0}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleOpen()}
        />
      )}

      <aside className={sidebarClasses} aria-hidden={isMobile ? !isOpen : false}>
        {/* Botón Toggle - hamburguesa en móvil */}
        <div className="p-4 flex justify-center border-b border-white/20">
          <button
            onClick={toggleOpen}
            className="p-2 hover:bg-white/10 rounded-md"
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Cerrar sidebar' : 'Abrir sidebar'}
          >
            <span className="text-2xl">☰</span>
          </button>
        </div>

        {/* Lista de Navegación */}
        <nav className="flex-1 mt-4 space-y-2">
          <div
            className="flex items-center p-4 hover:bg-white/10 cursor-pointer overflow-hidden"
            onClick={() => isMobile && toggleOpen()}
            tabIndex={0}
            role="button"
            onKeyDown={e => (isMobile && (e.key === 'Enter' || e.key === ' ')) && toggleOpen()}
          >
            <span className="text-xl min-w-[24px]">🏠</span>
            <span className="ml-4 font-medium">Inicio</span>
          </div>
          <div
            className="flex items-center p-4 hover:bg-white/10 cursor-pointer overflow-hidden"
            onClick={() => isMobile && toggleOpen()}
            tabIndex={0}
            role="button"
            onKeyDown={e => (isMobile && (e.key === 'Enter' || e.key === ' ')) && toggleOpen()}
          >
            <span className="text-xl min-w-[24px]">📦</span>
            <span className="ml-4 font-medium">Productos</span>
          </div>
        </nav>
      </aside>
    </>
  );
};