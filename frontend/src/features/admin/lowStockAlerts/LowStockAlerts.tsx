/**
 * frontend/src/features/admin/lowStockAlerts/LowStockAlerts.tsx
 * Componente para mostrar alertas de stock bajo
 */

import React, { useState, useEffect } from 'react';
import styles from './LowStockAlerts.module.css';
import {
  getLowStockAlerts,
  getLowStockAlertCount,
  type LowStockAlertsResponse,
} from './services/lowStockAlertsService';

export const LowStockAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<LowStockAlertsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  const loadAlerts = async (page = 1) => {
    setLoading(true);
    try {
      const data = await getLowStockAlerts(page, limit);
      setAlerts(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading low stock alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlertCount = async () => {
    try {
      const count = await getLowStockAlertCount();
      setAlertCount(count);
    } catch (error) {
      console.error('Error loading alert count:', error);
    }
  };

  useEffect(() => {
    loadAlerts(1);
    loadAlertCount();
  }, []);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadAlerts(currentPage);
      loadAlertCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentPage]);

  if (!alerts) {
    return <div className={styles.loading}>Cargando alertas...</div>;
  }

  const alertsData = Array.isArray(alerts.data) ? alerts.data : [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>⚠️ Alertas de Stock Bajo</h2>
        <div className={styles.badge}>
          {alertCount} alertas en últimas 24h
        </div>
      </div>

      {alertsData.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay alertas de stock bajo.</p>
        </div>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cliente</th>
                <th>Cantidad Vendida</th>
                <th>Stock Antes</th>
                <th>Stock Después</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {alertsData.map((alert) => (
                <tr key={alert.id} className={alert.stockAfter < 0 ? styles.critical : styles.warning}>
                  <td className={styles.productName}>{alert.productName}</td>
                  <td>
                    <small>
                      {alert.order?.customerFirstName ?? 'Cliente'} {alert.order?.customerLastName ?? ''}
                      <br />
                      <span className={styles.email}>{alert.order?.customerEmail ?? 'Sin email'}</span>
                    </small>
                  </td>
                  <td className={styles.number}>{alert.quantitySold}</td>
                  <td className={styles.number}>{alert.stockBefore}</td>
                  <td className={styles.number + ' ' + (alert.stockAfter < 0 ? styles.negative : '')}>
                    {alert.stockAfter}
                  </td>
                  <td className={styles.date}>
                    {new Date(alert.createdAt).toLocaleString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
        </>
      )}

      <button className={styles.refreshBtn} onClick={() => { loadAlerts(1); loadAlertCount(); }} disabled={loading}>
        {loading ? '🔄 Actualizando...' : '🔄 Actualizar'}
      </button>
    </div>
  );
};

export default LowStockAlerts;
