// ─────────────────────────────────────────────────────────────────────────────
// OrdersHeader.tsx
// Cabecera estática de la sección de pedidos.
// Muestra únicamente la bajada descriptiva para no duplicar el título del AdminHeader.
// ─────────────────────────────────────────────────────────────────────────────

import sectionStyles from '../../shared/AdminSection.module.css';

export function OrdersHeader() {
  return (
    <div className={sectionStyles.header}>
      <p className={sectionStyles.subtitle}>
        Revisá, procesá y gestioná los pedidos de clientes.
      </p>
    </div>
  );
}