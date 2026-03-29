import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook para detectar cambios no guardados y bloquear navegación.
 * - isDirty: booleano si hay cambios pendientes
 * - markDirty: marca el estado como "con cambios"
 * - resetDirty: limpia el estado de cambios
 * - confirmNavigation: función para forzar navegación
 */
export function useUnsavedChanges() {
    const [isDirty, setIsDirty] = useState(false);
    const confirmNextNavigation = useRef(false);

    // Marca el estado como sucio
    const markDirty = useCallback(() => setIsDirty(true), []);
    // Limpia el estado de cambios
    const resetDirty = useCallback(() => setIsDirty(false), []);
    // Permite la siguiente navegación
    const confirmNavigation = useCallback(() => {
        confirmNextNavigation.current = true;
    }, []);

    // Bloquea navegación de página (refresh/cerrar)
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

    return {
        isDirty,
        markDirty,
        resetDirty,
        confirmNavigation,
        confirmNextNavigation,
        setIsDirty,
    };
}
