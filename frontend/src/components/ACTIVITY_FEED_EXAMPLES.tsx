/**
 * ACTIVITY FEED - EJEMPLOS DE USO
 * 
 * Este archivo contiene ejemplos de cómo usar el sistema de Activity Feed
 * en diferentes partes de la aplicación.
 * 
 * Los ejemplos están comentados para servir como referencia.
 */

import React from 'react';
//import { logAdminActivity } from '../services/adminActivityLogService';
import { useActivityFeed } from '../hooks/useActivityFeed';

// ── EJEMPLO 1: REGISTRAR CREACIÓN DE PRODUCTO ────────────────────────────────

/*
function handleCreateProduct(product: any, currentUser: any) {
  logAdminActivity({
    timestamp: new Date().toISOString(),
    user: currentUser.email,
    action: 'create',
    entity: 'product',
    entityId: product.id,
    details: {
      name: product.name,
      sku: product.sku,
      price: product.price,
    },
  });
}
*/

// ── EJEMPLO 2: REGISTRAR EDICIÓN DE PRODUCTO ────────────────────────────────

/*
function handleUpdateProduct(
  oldProduct: any,
  newProduct: any,
  currentUser: any
) {
  logAdminActivity({
    timestamp: new Date().toISOString(),
    user: currentUser.email,
    action: 'edit',
    entity: 'product',
    entityId: newProduct.id,
    details: {
      changes: {
        before: { name: oldProduct.name, price: oldProduct.price },
        after: { name: newProduct.name, price: newProduct.price },
      },
    },
  });
}
*/

// ── EJEMPLO 3: REGISTRAR ELIMINACIÓN DE PRODUCTO ─────────────────────────────

/*
function handleDeleteProduct(
  productId: string,
  productName: string,
  currentUser: any
) {
  logAdminActivity({
    timestamp: new Date().toISOString(),
    user: currentUser.email,
    action: 'delete',
    entity: 'product',
    entityId: productId,
    details: {
      name: productName,
    },
  });
}
*/

// ── EJEMPLO 4: REGISTRAR CREACIÓN DE PEDIDO ──────────────────────────────────

/*
function handleCreateOrder(order: any, currentUser: any) {
  logAdminActivity({
    timestamp: new Date().toISOString(),
    user: currentUser.email,
    action: 'create',
    entity: 'order',
    entityId: order.id,
    details: {
      customer: order.customerEmail,
      total: order.total,
      itemCount: order.items?.length ?? 0,
    },
  });
}
*/

// ── EJEMPLO 5: USAR EL HOOK PERSONALIZADO ────────────────────────────────────

export const CustomActivityWidget: React.FC = () => {
    const {
        logs,
        isLoading,
        loadPending,
        refresh,
        pendingCount,
    } = useActivityFeed({
        pollInterval: 5000,
        maxEvents: 30,
        autoFetch: true,
    });

    return (
        <div>
            {isLoading && <p>Cargando actividades...</p>}

            {pendingCount > 0 && (
                <button onClick={loadPending}>
                    Cargar {pendingCount} nuevas actividades
                </button>
            )}

            {logs.map((log) => (
                <div key={`${log.timestamp}-${log.entityId}`}>
                    <strong>{log.user}</strong> {log.action} {log.entity} #{log.entityId}
                </div>
            ))}

            <button onClick={refresh}>Actualizar</button>
        </div>
    );
};
