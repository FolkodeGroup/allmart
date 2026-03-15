import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook para bloquear navegación si hay cambios sin guardar.
 * @param shouldBlock Si debe bloquear navegación.
 * @param onBlock Callback para mostrar advertencia/modal.
 */
export function useBlocker(shouldBlock: boolean, onBlock: (callback: () => void) => void) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!shouldBlock) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [shouldBlock]);

  useEffect(() => {
    if (!shouldBlock) return;
    // Aquí podrías interceptar clicks en enlaces, etc.
    // Para rutas internas, React Router v6 no expone un blocker nativo,
    // pero puedes interceptar cambios de location manualmente.
    // Este hook es un placeholder para integración.
  }, [shouldBlock, onBlock, navigate]);
}
