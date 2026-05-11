import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
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
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'ID de nota inválido.' });
        }

        const note = await staffNotesService.getStaffNoteById(id);
        if (!note) {
            return res.status(404).json({ error: 'Nota no encontrada.' });
        }

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
            return res.status(400).json({ error: 'Contenido requerido y debe ser texto.' });
        }

        const userId = (req as AuthenticatedRequest).user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado.' });
        }

        const note = await staffNotesService.createStaffNote(content, userId);
        res.status(201).json(note);
    } catch (err) {
        logStaffNotesError('create', err);
        const message = err instanceof Error ? err.message : 'Error al crear la nota.';
        res.status(400).json({ error: message });
    }
};

export const update = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'ID de nota inválido.' });
        }

        if (!content || typeof content !== 'string') {
            return res.status(400).json({ error: 'Contenido requerido y debe ser texto.' });
        }

        const note = await staffNotesService.updateStaffNote(id, content);
        res.json(note);
    } catch (err) {
        logStaffNotesError('update', err);
        const message = err instanceof Error ? err.message : 'Error al actualizar la nota.';
        const statusCode = message.includes('no encontrada') ? 404 : 400;
        res.status(statusCode).json({ error: message });
    }
};

export const remove = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'ID de nota inválido.' });
        }

        await staffNotesService.deleteStaffNote(id);
        res.status(204).send();
    } catch (err) {
        logStaffNotesError('remove', err);
        const message = err instanceof Error ? err.message : 'Error al eliminar la nota.';
        const statusCode = message.includes('no encontrada') ? 404 : 400;
        res.status(statusCode).json({ error: message });
    }
};