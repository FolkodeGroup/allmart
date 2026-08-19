import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../../../context/AdminAuthContext';
import { useAdminOrders } from '../../../../context/AdminOrdersContext';
import { fetchAdminOrderById } from '../ordersService';
import type { Order } from '../../../../context/AdminOrdersContext';
import toast from 'react-hot-toast';
import styles from './OrderDetailPage.module.css';
import { Button } from '../../../../components/ui/Button/Button';
import { OrderDetailContent } from '../components/OrderDetailContent';
import { formatDateTime, formatPrice } from '../utils/ordersHelpers';
import { formatOrderLabel } from '../../../../utils/orders';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const { getOrder, orders } = useAdminOrders();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Mantener actualizado el pedido si cambia en el contexto global de pedidos
  useEffect(() => {
    if (!id) return;
    const currentContextOrder = getOrder(id);
    if (currentContextOrder) {
      setOrder(currentContextOrder);
    }
  }, [id, orders, getOrder]);

  useEffect(() => {
    if (!id || !token) {
      return;
    }

    const loadOrder = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setNotFound(false);

        let orderData = getOrder(id);

        if (!orderData) {
          orderData = await fetchAdminOrderById(token, id);
        }

        setOrder(orderData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';

        if (message.includes('404') || message.includes('no encontrado')) {
          setNotFound(true);
          setError(null);
        } else {
          setError(message);
        }

        toast.error(`Error al cargar el pedido: ${message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [id, token, getOrder]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Cargando detalles del pedido...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>😕</div>
          <h1 className={styles.errorTitle}>Pedido no encontrado</h1>
          <p className={styles.errorMessage}>
            El {formatOrderLabel(id ?? '')} no existe o fue eliminado.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/admin/pedidos')}
          >
            ← Volver a la lista de pedidos
          </Button>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <h1 className={styles.errorTitle}>Error al cargar el pedido</h1>
          <p className={styles.errorMessage}>
            {error || 'No se pudo cargar la información del pedido.'}
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/admin/pedidos')}
          >
            ← Volver a la lista de pedidos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} orderDetailPageFullWidth`}>
      <style>{`
        .orderDetailPageFullWidth {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 0 32px 0 !important;
          box-sizing: border-box !important;
        }

        .orderDetailPageFullWidth .orderDetailHeaderCard {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          margin-bottom: 20px !important;
        }

        .orderDetailPageFullWidth .orderDetailContentWrapper {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }

        @media (min-width: 768px) {
          .orderDetailPageFullWidth {
            padding: 0 4px 32px 4px !important;
          }
        }
      `}</style>
      {/* Header con navegación y metadatos */}
      <div className={`${styles.header} orderDetailHeaderCard`}>
        <div className={styles.headerContent}>
          <button
            className={styles.backButton}
            onClick={() => navigate('/admin/pedidos')}
            title="Volver a la lista de pedidos"
            aria-label="Volver a la lista de pedidos"
            type="button"
          >
            <span className={styles.backIcon}>←</span>
            <span className={styles.backText}>Volver</span>
          </button>

          <div className={styles.headerInfo}>
            <h1 className={styles.title}>
              {formatOrderLabel(order.id)}
            </h1>
            <div className={styles.headerMeta}>
              <span className={styles.metaItem}>
                {formatDateTime(order.createdAt)}
              </span>
              <span className={styles.metaDivider}>•</span>
              <span className={styles.metaItem}>
                {formatPrice(order.total)}
              </span>
              <span className={styles.metaDivider}>•</span>
              <span className={styles.metaItem}>
                {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal en 100% del ancho */}
      <div className={`${styles.content} orderDetailContentWrapper`}>
        <OrderDetailContent order={order} onClose={() => navigate('/admin/pedidos')} />
      </div>
    </div>
  );
}