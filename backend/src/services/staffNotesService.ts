import { prisma } from '../config/prisma';
import type { StaffNote } from '@prisma/client';

// Type for StaffNote with included user data
type StaffNoteWithUser = StaffNote & {
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
};

const userSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
} as const;

export const getAllStaffNotes = async (): Promise<StaffNoteWithUser[]> => {
    try {
        return await prisma.staffNote.findMany({
            include: { user: { select: userSelect } },
            orderBy: { createdAt: 'desc' },
        });
    } catch (err) {
        console.error('[staffNotesService] getAllStaffNotes error:', err);
        const error = new Error('Error al obtener las notas del staff.');
        (error as any).cause = err;
        throw error;
    }
};

export const getStaffNoteById = async (id: string): Promise<StaffNoteWithUser | null> => {
    try {
        return await prisma.staffNote.findUnique({
            where: { id },
            include: { user: { select: userSelect } },
        });
    } catch (err) {
        console.error('[staffNotesService] getStaffNoteById error:', err);
        const error = new Error('Error al obtener la nota.');
        (error as any).cause = err;
        throw error;
    }
};

export const createStaffNote = async (content: string, userId: string): Promise<StaffNoteWithUser> => {
    // Validate input
    if (!content || typeof content !== 'string') {
        throw new Error('El contenido de la nota es requerido y debe ser texto.');
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
        throw new Error('La nota no puede estar vacía.');
    }

    if (trimmedContent.length > 5000) {
        throw new Error('La nota es demasiado larga (máximo 5000 caracteres).');
    }

    try {
        return await prisma.staffNote.create({
            data: {
                content: trimmedContent,
                userId
            },
            include: { user: { select: userSelect } },
        });
    } catch (err) {
        console.error('[staffNotesService] createStaffNote error:', err);
        const error = new Error('Error al crear la nota.');
        (error as any).cause = err;
        throw error;
    }
};

export const updateStaffNote = async (id: string, content: string): Promise<StaffNoteWithUser> => {
    // Validate input
    if (!content || typeof content !== 'string') {
        throw new Error('El contenido de la nota es requerido y debe ser texto.');
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
        throw new Error('La nota no puede estar vacía.');
    }

    if (trimmedContent.length > 5000) {
        throw new Error('La nota es demasiado larga (máximo 5000 caracteres).');
    }

    try {
        // Check if note exists
        const note = await prisma.staffNote.findUnique({ where: { id } });
        if (!note) {
            throw new Error('Nota no encontrada.');
        }

        return await prisma.staffNote.update({
            where: { id },
            data: { content: trimmedContent },
            include: { user: { select: userSelect } },
        });
    } catch (err) {
        console.error('[staffNotesService] updateStaffNote error:', err);
        if (err instanceof Error && err.message === 'Nota no encontrada.') {
            throw err;
        }
        const error = new Error('Error al actualizar la nota.');
        (error as any).cause = err;
        throw error;
    }
};

export const deleteStaffNote = async (id: string): Promise<void> => {
    try {
        // Check if note exists
        const note = await prisma.staffNote.findUnique({ where: { id } });
        if (!note) {
            throw new Error('Nota no encontrada.');
        }

        await prisma.staffNote.delete({ where: { id } });
    } catch (err) {
        console.error('[staffNotesService] deleteStaffNote error:', err);
        if (err instanceof Error && err.message === 'Nota no encontrada.') {
            throw err;
        }
        const error = new Error('Error al eliminar la nota.');
        (error as any).cause = err;
        throw error;
    }
};