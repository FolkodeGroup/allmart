import { prisma } from '../config/prisma';

export const getAllStaffNotes = async () => {
    return prisma.staffNote.findMany({
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
    });
};

export const getStaffNoteById = async (id: string) => {
    return prisma.staffNote.findUnique({
        where: { id },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
};

export const createStaffNote = async (content: string, userId: string) => {
    return prisma.staffNote.create({
        data: { content, userId },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
};

export const updateStaffNote = async (id: string, content: string) => {
    return prisma.staffNote.update({
        where: { id },
        data: { content },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
};

export const deleteStaffNote = async (id: string) => {
    return prisma.staffNote.delete({ where: { id } });
};