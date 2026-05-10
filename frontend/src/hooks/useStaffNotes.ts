import { useCallback, useEffect, useState } from 'react';
import type { StaffNote } from '../types/staffNote';
import * as staffNotesService from '../services/staffNotesService';

interface UseStaffNotesReturn {
    notes: StaffNote[];
    loading: boolean;
    error: string | null;
    fetchNotes: () => Promise<void>;
    createNote: (content: string) => Promise<StaffNote>;
    updateNote: (id: string, content: string) => Promise<StaffNote>;
    deleteNote: (id: string) => Promise<void>;
}

export function useStaffNotes(): UseStaffNotesReturn {
    const [notes, setNotes] = useState<StaffNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await staffNotesService.fetchStaffNotes();
            setNotes(data);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al cargar las notas del staff.';
            setError(errorMessage);
            console.error('[useStaffNotes] fetchNotes error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const createNote = useCallback(async (content: string): Promise<StaffNote> => {
        setError(null);
        try {
            const newNote = await staffNotesService.createStaffNote(content);
            setNotes((prev) => [newNote, ...prev]);
            return newNote;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al crear la nota.';
            setError(errorMessage);
            console.error('[useStaffNotes] createNote error:', err);
            throw err;
        }
    }, []);

    const updateNote = useCallback(async (id: string, content: string): Promise<StaffNote> => {
        setError(null);
        try {
            const updated = await staffNotesService.updateStaffNote(id, content);
            setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
            return updated;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al actualizar la nota.';
            setError(errorMessage);
            console.error('[useStaffNotes] updateNote error:', err);
            throw err;
        }
    }, []);

    const deleteNote = useCallback(async (id: string): Promise<void> => {
        setError(null);
        try {
            await staffNotesService.deleteStaffNote(id);
            setNotes((prev) => prev.filter((n) => n.id !== id));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al eliminar la nota.';
            setError(errorMessage);
            console.error('[useStaffNotes] deleteNote error:', err);
            throw err;
        }
    }, []);

    return { notes, loading, error, fetchNotes, createNote, updateNote, deleteNote };
}