/**
 * frontend/src/features/admin/outOfStockAlerts/OutOfStockAlerts.tsx
 * Componente para mostrar alertas de productos sin stock con pedidos pendientes
 */

import React, { useState, useEffect } from 'react';
import styles from './OutOfStockAlerts.module.css';
import {
  getOutOfStockAlerts,
  type OutOfStockAlertsResponse,
} from './services/outOfStockAlertsService';

export const OutOfStockAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<OutOfStockAlertsResponse | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  const loadAlerts = async (page = 1) => {
    setLoading(true);
    try {
      const data = await getOutOfStockAlerts(page, limit);
      setAlerts(data);
      setCurrentPage(data.page);
    } catch (error) {
      console.error('Error loading out of stock alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts(1);
  }, []);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadAlerts(currentPage);
    }, 30000);

    return () => clearInterval(interval);
  }, [currentPage]);

  const toggleProductExpanded = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  if (!alerts) {
    return <div className={styles.loading}>Cargando alertas...</div>;
  }

  const alertsData = Array.isArray(alerts.data) ? alerts.data : [];

  if (alertsData.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Productos sin stock con pedidos pendientes</h2>
        </div>
        <div className={styles.empty}>
          <p>¡Excelente! No hay productos sin stock con pedidos pendientes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Productos sin stock con pedidos pendientes</h2>
        <div className={styles.badge}>{alertsData.length} producto(s)</div>
      </div>

      <div className={styles.alertsList}>
        {alertsData.map((alert) => (
          <div key={alert.productId} className={styles.alertCard}>
            <button className={styles.cardHeader} onClick={() => toggleProductExpanded(alert.productId)} type="button" aria-expanded={expandedProducts.has(alert.productId)}>
              <div className={styles.productInfo}>
                <h3>{alert.productName}</h3>
                <div className={styles.metadata}>
                  <span className={styles.sku}>SKU: {alert.productSku || 'N/A'}</span>
                  <span className={styles.stock}>Stock: {alert.stock}</span>
                </div>
              </div>
              <div className={styles.summary}>
                <div className={styles.summaryItem}>
                  <span className={styles.label}>Órdenes pendientes:</span>
                  <span className={styles.value}>{alert.totalPendingOrders}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.label}>Total solicitado:</span>
                  <span className={styles.value}>{alert.totalQuantityOrdered} unidades</span>
                </div>
              </div>
              <span className={styles.expandBtn} aria-hidden="true">
                {expandedProducts.has(alert.productId) ? '▼' : '▶'}
              </span>
            </button>

            {expandedProducts.has(alert.productId) && (
              <div className={styles.cardContent}>
                <h4>Pedidos Pendientes:</h4>
                {alert.orders.map((order) => (
                  <div key={order.id} className={styles.orderRow}>
                    <div className={styles.orderHeader}>
                      <div className={styles.orderInfo}>
                        <strong>Pedido #{order.id.slice(0, 8)}</strong>
                        <span className={styles.status}>{order.status}</span>
                      </div>
                      <div className={styles.customer}>
                        {order.customerFirstName} {order.customerLastName}
                      </div>
                      <div className={styles.contact}>
                        <a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a>
                        {order.customerPhone && <span> | {order.customerPhone}</span>}
                      </div>
                      <div className={styles.total}>
                        Total: ${parseFloat(order.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className={styles.date}>
                        {new Date(order.createdAt).toLocaleString('es-AR')}
                      </div>
                    </div>
                    {order.items.length > 0 && (
                      <div className={styles.orderItems}>
                        {order.items.map((item) => (
                          <div key={item.id} className={styles.item}>
                            <span className={styles.itemName}>{item.productName}</span>
                            <span className={styles.itemQty}>x{item.quantity}</span>
                            <span className={styles.itemPrice}>
                              ${parseFloat(item.unitPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Paginación */}
      {alerts.pages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => loadAlerts(1)}
            disabled={currentPage === 1 || loading}
          >
            Primera
          </button>
          <button
            className={styles.pageBtn}
            onClick={() => loadAlerts(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            Anterior
          </button>

          <span className={styles.pageInfo}>
            Página {alerts.page} de {alerts.pages}
          </span>

          <button
            className={styles.pageBtn}
            onClick={() => loadAlerts(currentPage + 1)}
            disabled={currentPage === alerts.pages || loading}
          >
            Siguiente
          </button>
          <button
            className={styles.pageBtn}
            onClick={() => loadAlerts(alerts.pages)}
            disabled={currentPage === alerts.pages || loading}
          >
            Última
          </button>
        </div>
      )}

      <button className={styles.refreshBtn} onClick={() => loadAlerts(1)} disabled={loading}>
        {loading ? 'Actualizando...' : 'Actualizar'}
      </button>
    </div>
  );
};
