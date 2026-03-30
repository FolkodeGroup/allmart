import { useEffect, useCallback, useState } from 'react';

interface UseUnsavedChangesWarningOptions {
  active: boolean;
  onConfirmExit?: () => void;
}

/**
 * Hook para detectar cambios no guardados y bloquear navegación accidental.
 *
 * @param options.active Si la protección está activa
 * @param options.onConfirmExit Callback opcional al confirmar salida
 * @returns {Object} isDirty, setIsDirty, showWarning, interceptNavigation, confirmNavigation, cancelNavigation
 *
 * Uso típico:
 * const { setIsDirty, showWarning, confirmNavigation, cancelNavigation } = useUnsavedChangesWarning({ active: true });
 */
export function useUnsavedChangesWarning({ active }: UseUnsavedChangesWarningOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<null | (() => void)>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Handler for browser unload
  useEffect(() => {
    if (!active || !isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handler);

    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [active, isDirty]);

  // Handler for router navigation
  const interceptNavigation = useCallback((callback: () => void) => {
    if (!active || !isDirty) {
      callback();
      return;
    }

    setShowWarning(true);
    setPendingNavigation(() => callback);
  }, [active, isDirty]);

  const confirmNavigation = () => {
    setShowWarning(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const cancelNavigation = () => {
    setShowWarning(false);
    setPendingNavigation(null);
  };
  /*
    // Confirm exit
    const confirmExit = useCallback(() => {
      setShowWarning(false);
      setPendingNavigation(null);
      if (onConfirmExit) onConfirmExit();
      if (pendingNavigation) pendingNavigation();
    }, [onConfirmExit, pendingNavigation]);
  
    // Cancel exit
    const cancelExit = useCallback(() => {
      setShowWarning(false);
      setPendingNavigation(null);
    }, []);
  */
  return {
    isDirty,
    setIsDirty,
    showWarning,
    interceptNavigation,
    confirmNavigation,
    cancelNavigation,
  };
}
