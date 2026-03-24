import { Request, Response } from 'express';

// Extensión mínima para req.user (usada por middlewares de auth)
interface AuthRequest extends Request {
    user?: { id: string };
}
import * as staffNotesService from '../../services/staffNotesService';

function logStaffNotesError(action: string, err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[StaffNotes][${action}] ${message}`);
}

export const getAll = async (req: Request, res: Response) => {
    try {
        const notes = await staffNotesService.getAllStaffNotes();
        res.json(notes);
    } catch (err) {
        logStaffNotesError('getAll', err);
        res.status(500).json({ error: 'Error al obtener las notas del staff.' });
    }
};

export const getById = async (req: Request, res: Response) => {
    try {
        const note = await staffNotesService.getStaffNoteById(req.params.id);
        if (!note) return res.status(404).json({ error: 'Nota no encontrada.' });
        res.json(note);
    } catch (err) {
        logStaffNotesError('getById', err);
        res.status(500).json({ error: 'Error al obtener la nota.' });
    }
};

export const create = async (req: Request, res: Response) => {
    try {
        const { content } = req.body;
        if (!content || typeof content !== 'string') {
            return res.status(400).json({ error: 'Contenido requerido.' });
        }
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ error: 'Usuario no autenticado.' });
        const note = await staffNotesService.createStaffNote(content, userId);
        res.status(201).json(note);
    } catch (err) {
        logStaffNotesError('create', err);
        res.status(500).json({ error: 'Error al crear la nota.' });
    }
};

export const update = async (req: Request, res: Response) => {
    try {
        const { content } = req.body;
        if (!content || typeof content !== 'string') {
            return res.status(400).json({ error: 'Contenido requerido.' });
        }
        const note = await staffNotesService.updateStaffNote(req.params.id, content);
        res.json(note);
    } catch (err) {
        logStaffNotesError('update', err);
        res.status(500).json({ error: 'Error al actualizar la nota.' });
    }
};

export const remove = async (req: Request, res: Response) => {
    try {
        await staffNotesService.deleteStaffNote(req.params.id);
        res.status(204).send();
    } catch (err) {
        logStaffNotesError('remove', err);
        res.status(500).json({ error: 'Error al eliminar la nota.' });
    }
};