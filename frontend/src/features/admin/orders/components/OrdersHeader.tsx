import sectionStyles from '../../shared/AdminSection.module.css';
import { Tooltip } from '../../../../components/ui/Tooltip/Tooltip';

export function OrdersHeader() {
  return (
    <div className={sectionStyles.header}>
      <span className={sectionStyles.label}>Administración</span>
      <h1 className={sectionStyles.title}>
        <span className={sectionStyles.icon}>🛒</span> Pedidos
        <Tooltip content="Aquí podés ver y gestionar todos los pedidos realizados por los clientes. Usa los filtros y acciones para administrar el flujo de ventas.">
          <button
            type="button"
            aria-label="Ayuda sección pedidos"
            style={{ background: 'none', border: 'none', marginLeft: 8, cursor: 'pointer', color: '#2563eb', fontSize: 20 }}
            tabIndex={0}
          >
          </button>
        </Tooltip>
      </h1>
      <p className={sectionStyles.subtitle}>
        Revisá, procesá y gestioná los pedidos de clientes.
      </p>
    </div>
  );
}
