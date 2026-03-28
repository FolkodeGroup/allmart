import { useContext } from 'react';
import { UnsavedChangesContext } from './UnsavedChangesContext';

export const useUnsavedChanges = () => {
    const ctx = useContext(UnsavedChangesContext);
    if (!ctx) {
        throw new Error('useUnsavedChanges debe usarse dentro de UnsavedChangesProvider');
    }
    return ctx;
};