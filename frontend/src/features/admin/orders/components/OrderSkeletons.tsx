import styles from '../AdminOrders.module.css';

/** Skeleton de tarjeta de resumen (métrica por estado). */
export function SummarySkeleton() {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.skeletonSummaryIcon} />
      <div className={styles.skeletonSummaryNum} />
      <div className={styles.skeletonSummaryLabel} />
    </div>
  );
}

/** Skeleton de fila de la tabla de pedidos (desktop). */
export function TableRowSkeleton() {
  return (
    <tr className={styles.row}>
      <td className={styles.orderId}><div className={styles.skeletonOrderId} /></td>
      <td className={styles.orderDate}><div className={styles.skeletonOrderDate} /></td>
      <td>
        <div className={styles.skeletonCustomerName} />
        <div className={styles.skeletonCustomerEmail} />
      </td>
      <td className={styles.itemCount}><div className={styles.skeletonItemCount} /></td>
      <td className={styles.orderTotal}><div className={styles.skeletonOrderTotal} /></td>
      <td><div className={styles.skeletonStatusBadge} /></td>
      <td><div className={styles.skeletonButton} /></td>
    </tr>
  );
}

/** Skeleton de tarjeta de pedido (mobile). */
export function MobileCardSkeleton() {
  return (
    <div className={styles.mobileCard}>
      <div className={styles.mobileCardTop}>
        <div className={styles.skeletonMobileCardId} />
        <div className={styles.skeletonMobileBadge} />
      </div>
      <div className={styles.mobileCardMid}>
        <div className={styles.mobileCardCustomer}>
          <div className={styles.skeletonMobileAvatar} />
          <div>
            <div className={styles.skeletonMobileCardName} />
            <div className={styles.skeletonMobileCardEmail} />
          </div>
        </div>
      </div>
      <div className={styles.mobileCardBottom}>
        <div className={styles.skeletonMobileCardDate} />
        <div className={styles.skeletonMobileCardItems} />
        <div className={styles.skeletonMobileCardTotal} />
      </div>
    </div>
  );
}
