import { createContext } from 'react';
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning';

interface UnsavedChangesContextType {
    isDirty: boolean;
    setIsDirty: (value: boolean) => void;
    showWarning: boolean;
    interceptNavigation: (callback: () => void) => void;
    confirmNavigation: () => void;
    cancelNavigation: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const UnsavedChangesContext = createContext<UnsavedChangesContextType | null>(null);

export const UnsavedChangesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const state = useUnsavedChangesWarning({ active: true });

    return (
        <UnsavedChangesContext.Provider value={state}>
            {children}
        </UnsavedChangesContext.Provider>
    );
};

