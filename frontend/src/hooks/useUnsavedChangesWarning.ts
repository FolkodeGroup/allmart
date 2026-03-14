import { useEffect, useCallback, useState } from 'react';

interface UseUnsavedChangesWarningOptions {
  active: boolean;
  onConfirmExit?: () => void;
}

export function useUnsavedChangesWarning({ active, onConfirmExit }: UseUnsavedChangesWarningOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<null | (() => void)>(null);

  // Handler for browser unload
  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [active]);

  // Handler for router navigation
  const interceptNavigation = useCallback((callback: () => void) => {
    if (active) {
      setShowWarning(true);
      setPendingNavigation(() => callback);
    } else {
      callback();
    }
  }, [active]);

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

  return {
    showWarning,
    interceptNavigation,
    confirmExit,
    cancelExit,
  };
}
