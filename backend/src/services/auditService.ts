/**
 * services/auditService.ts
 * Servicio centralizado para el registro inmutable de logs de auditoría interna.
 * Garantiza un formato homogéneo y un flujo seguro (fail-safe).
 */

import { prisma } from '../config/prisma';

export interface AuditLogInput {
  userEmail: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, any>;
}

/**
 * Registra una acción de auditoría en la base de datos de manera inmutable.
 * Captura excepciones internas para evitar interrumpir transacciones críticas de negocio.
 */
export async function recordAction(input: AuditLogInput): Promise<void> {
  try {
    const user = input.userEmail?.trim() || 'desconocido';
    const cleanDetails = input.details ?? {};

    await prisma.auditLog.create({
      data: {
        userEmail: user,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        details: cleanDetails,
      },
    });

    console.log(`[Audit][Success] Acción '${input.action}' sobre '${input.entity}' registrada para: ${user}`);
  } catch (error) {
    // Diseño Fail-Safe: Impedimos que un error en el logging bloquee la API del cliente
    console.error('[Audit][Error] Falló el registro del log de auditoría:', error);
  }
}