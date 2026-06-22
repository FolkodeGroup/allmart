// ─────────────────────────────────────────────────────────────────────────────
// OrdersHeader.tsx
// Cabecera estática de la sección de pedidos.
// Solo renderiza título, subtítulo y tooltip de ayuda. Sin lógica.
// ─────────────────────────────────────────────────────────────────────────────


import sectionStyles from '../../shared/AdminSection.module.css';
import { Tooltip } from '../../../../components/ui/Tooltip/Tooltip';

/**
 * OrdersHeader — encabezado de la página de gestión de pedidos.
 *
 * Muestra:
 *  - Breadcrumb/label "Administración"
 *  - Título "Pedidos" con ícono y botón de ayuda contextual (Tooltip)
 *  - Subtítulo descriptivo
 *
 * No recibe props; es completamente estático.
 */

export function OrdersHeader() {
  return (
    <div className={sectionStyles.header}>
      {/* Etiqueta de sección (breadcrumb visual) */}
      <span className={sectionStyles.label}>Administración</span>
      <h1 className={sectionStyles.title}>
        <span className={sectionStyles.icon}>🛒</span> Pedidos
        {/*
          Botón de ayuda: abre un Tooltip con descripción de la sección.
          El botón está vacío visualmente; el contenido lo provee el Tooltip.
          aria-label garantiza accesibilidad para lectores de pantalla.
        */}
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
