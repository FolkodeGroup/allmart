// ─────────────────────────────────────────────────────────────────────────────
// OrderDetailPage.tsx
// Página de detalle de un pedido específico, accesible directamente por URL.
// Ejemplo: /admin/pedidos/550e8400-e29b-41d4-a716-446655440000
//
// Responsabilidades:
//  - Cargar el pedido por ID desde la API
//  - Mostrar estado de carga y errores (incluyendo 404)
//  - Renderizar el contenido completo del pedido
//  - Permitir edición de estado, pago y notas
//  - Navegar de vuelta a la lista de pedidos
// ─────────────────────────────────────────────────────────────────────────────

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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const { getOrder } = useAdminOrders();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Cargar el pedido cuando se monta el componente
  useEffect(() => {
    if (!id || !token) {
      return;
    }

    const loadOrder = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setNotFound(false);

        // Intentar obtener del contexto primero
        let orderData = getOrder(id);

        // Si no está en el contexto, traer de la API
        if (!orderData) {
          orderData = await fetchAdminOrderById(token, id);
        }

        setOrder(orderData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';

        // Detectar error 404
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

  // ── Renderizado de estados ──────────────────────────────────────

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
            El pedido con ID <strong>{id}</strong> no existe o fue eliminado.
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
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/admin/pedidos')}
          >
            ← Volver
          </Button>
          <h1 className={styles.title}>
            Pedido #{order.id.slice(0, 8).toUpperCase()}
          </h1>
        </div>
      </div>

      <div className={styles.content}>
        <OrderDetailContent order={order} />
      </div>
    </div>
  );
}
