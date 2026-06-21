import { useEffect, useCallback, useState, useRef } from 'react';

interface UseUnsavedChangesWarningOptions {
  active: boolean;
  onConfirmExit?: () => void;
}

export function useUnsavedChangesWarning({ active }: UseUnsavedChangesWarningOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const pendingNavigation = useRef<null | (() => void)>(null);

  // Ref para que interceptNavigation siempre lea el valor actual sin recrear el callback
  const isDirtyRef = useRef(isDirty);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const interceptNavigation = useCallback((callback: () => void) => {
    if (!active || !isDirtyRef.current) {
      callback();
      return;
    }
    setShowWarning(true);
    pendingNavigation.current = callback;
  }, [active]);

  const confirmNavigation = useCallback(() => {
    setShowWarning(false);
    setIsDirty(false);
    isDirtyRef.current = false;
    pendingNavigation.current?.();
    pendingNavigation.current = null;
  }, []);

  const cancelNavigation = useCallback(() => {
    setShowWarning(false);
    pendingNavigation.current = null;
  }, []);

  return {
    isDirty,
    setIsDirty,
    showWarning,
    interceptNavigation,
    confirmNavigation,
    cancelNavigation,
  };
}