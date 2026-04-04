// hooks/useUnsavedChangesWarning.ts — reemplazar completo

import { useEffect, useCallback, useState, useRef } from 'react';

interface UseUnsavedChangesWarningOptions {
  active: boolean;
  onConfirmExit?: () => void;
}

export function useUnsavedChangesWarning({ active }: UseUnsavedChangesWarningOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const pendingNavigation = useRef<null | (() => void)>(null);

  // ← Ref para que interceptNavigation siempre lea el valor actual
  const isDirtyRef = useRef(isDirty);
  useEffect(() => {
    isDirtyRef.current = isDirty;
    console.log('[UnsavedChangesWarning] isDirtyRef actualizado a:', isDirty);
  }, [isDirty]);

  useEffect(() => {
    if (!active || !isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [active, isDirty]);

  // ← Ya no depende de isDirty en el closure, lee la ref
  const interceptNavigation = useCallback((callback: () => void) => {
    console.log('[interceptNavigation] llamado. active:', active, '| isDirtyRef.current:', isDirtyRef.current);
    if (!active || !isDirty) {
      console.log('[interceptNavigation] → navegando directo (no dirty)');
      callback();
      return;
    }
    console.log('[interceptNavigation] → mostrando warning');
    setShowWarning(true);
    pendingNavigation.current = callback;
  }, [active, isDirty]); // ← solo depende de active

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