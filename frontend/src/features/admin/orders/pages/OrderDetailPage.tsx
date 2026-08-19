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
import { ArrowLeft } from 'lucide-react';

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
          background: var(--color-bg-secondary, #1f2937) !important;
          border: 1px solid var(--color-border, #374151) !important;
          border-radius: 14px !important;
          padding: 16px 20px !important;
        }

        .orderDetailHeaderInner {
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 12px !important;
          width: 100% !important;
        }

        .orderDetailBackBtn {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          gap: 6px !important;
          padding: 6px 14px !important;
          background: rgba(255, 255, 255, 0.06) !important;
          border: 1px solid var(--color-border, #374151) !important;
          border-radius: 8px !important;
          color: var(--color-text-primary, #ffffff) !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.15s ease !important;
          min-height: 36px !important;
          align-self: flex-start !important;
          text-decoration: none !important;
        }

        .orderDetailBackBtn:hover {
          background: rgba(255, 255, 255, 0.12) !important;
          border-color: var(--color-primary, #769282) !important;
          color: var(--color-text-primary, #ffffff) !important;
        }

        .orderDetailHeaderTitleGroup {
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 4px !important;
          width: 100% !important;
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

          .orderDetailHeaderInner {
            flex-direction: row !important;
            align-items: center !important;
            gap: 16px !important;
          }
        }
      `}</style>

      {/* Header con botón Volver alineado a la izquierda */}
      <div className={`${styles.header} orderDetailHeaderCard`}>
        <div className="orderDetailHeaderInner">
          <button
            className="orderDetailBackBtn"
            onClick={() => navigate('/admin/pedidos')}
            title="Volver a la lista de pedidos"
            aria-label="Volver a la lista de pedidos"
            type="button"
          >
            <ArrowLeft size={16} />
            <span>Volver</span>
          </button>

          <div className="orderDetailHeaderTitleGroup">
            <h1 className={styles.title} style={{ margin: 0 }}>
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

      {/* Contenido principal expandido al 100% */}
      <div className={`${styles.content} orderDetailContentWrapper`}>
        <OrderDetailContent order={order} onClose={() => navigate('/admin/pedidos')} />
      </div>
    </div>
  );
}