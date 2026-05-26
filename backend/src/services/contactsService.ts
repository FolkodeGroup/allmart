/**
 * services/contactsService.ts
 * Lógica de negocio para gestionar mensajes de contacto.
 */

import { prisma } from '../config/prisma';

export interface CreateContactInput {
  name: string;
  email: string;
  phone: string | null;
  message: string;
}

export interface UpdateContactInput {
  status?: string;
  isFlagged?: boolean;
  adminNotes?: string;
}

export interface ListContactsOptions {
  page?: number;
  limit?: number;
  status?: string;
  isFlagged?: boolean;
  search?: string;
}

/**
 * Crear un nuevo mensaje de contacto
 */
export async function createContact(input: CreateContactInput) {
  const contact = await prisma.contact.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      message: input.message,
      status: 'unread',
    },
  });

  return contact;
}

/**
 * Obtener un contacto por ID
 */
export async function getContactById(id: string) {
  const contact = await prisma.contact.findUnique({
    where: { id },
  });

  return contact;
}

/**
 * Obtener lista de contactos con filtros y paginación
 */
export async function listContacts(options: ListContactsOptions) {
  const { page = 1, limit = 20, status, isFlagged = false, search } = options;

  const skip = (page - 1) * limit;

  // Construir filtros
  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (isFlagged !== undefined) {
    where.isFlagged = isFlagged;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { message: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Obtener total de registros
  const total = await prisma.contact.count({ where });

  // Obtener registros paginados
  const contacts = await prisma.contact.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return {
    data: contacts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Actualizar un contacto
 */
export async function updateContact(id: string, input: UpdateContactInput) {
  // Validar que el contacto existe
  const existing = await prisma.contact.findUnique({
    where: { id },
  });

  if (!existing) {
    throw Object.assign(new Error('Contacto no encontrado'), { statusCode: 404 });
  }

  const data: any = {};

  if (input.status !== undefined) {
    data.status = input.status;
  }

  if (input.isFlagged !== undefined) {
    data.isFlagged = input.isFlagged;
  }

  if (input.adminNotes !== undefined) {
    data.adminNotes = input.adminNotes;
  }

  const contact = await prisma.contact.update({
    where: { id },
    data,
  });

  return contact;
}

/**
 * Eliminar un contacto
 */
export async function deleteContact(id: string) {
  // Validar que el contacto existe
  const existing = await prisma.contact.findUnique({
    where: { id },
  });

  if (!existing) {
    throw Object.assign(new Error('Contacto no encontrado'), { statusCode: 404 });
  }

  await prisma.contact.delete({
    where: { id },
  });
}

/**
 * Obtener estadísticas de contactos
 */
export async function getContactStats() {
  const total = await prisma.contact.count();
  const unread = await prisma.contact.count({
    where: { status: 'unread' },
  });
  const flagged = await prisma.contact.count({
    where: { isFlagged: true },
  });

  return { total, unread, flagged };
}
