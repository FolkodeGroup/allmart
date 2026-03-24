import { useCallback, useEffect, useState } from 'react';
import type { StaffNote } from '../types/staffNote';
import * as staffNotesService from '../services/staffNotesService';

export function useStaffNotes() {
    const [notes, setNotes] = useState<StaffNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await staffNotesService.fetchStaffNotes();
            setNotes(data);
        } catch {
            setError('Error al cargar las notas del staff.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const createNote = async (content: string) => {
        try {
            const newNote = await staffNotesService.createStaffNote(content);
            setNotes((prev) => [newNote, ...prev]);
        } catch {
            setError('Error al crear la nota.');
        }
    };

    const updateNote = async (id: string, content: string) => {
        try {
            const updated = await staffNotesService.updateStaffNote(id, content);
            setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
        } catch {
            setError('Error al actualizar la nota.');
        }
    };

    const deleteNote = async (id: string) => {
        try {
            await staffNotesService.deleteStaffNote(id);
            setNotes((prev) => prev.filter((n) => n.id !== id));
        } catch {
            setError('Error al eliminar la nota.');
        }
    };

    return { notes, loading, error, fetchNotes, createNote, updateNote, deleteNote };
}