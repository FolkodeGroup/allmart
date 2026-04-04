import { StaticInfoLayout, type StaticInfoSection } from './StaticInfoLayout';

const sections: StaticInfoSection[] = [
  {
    title: 'Cobertura de envíos',
    paragraphs: [
      'Realizamos envíos dentro de la República Argentina.',
      'La disponibilidad puede variar según localidad, operador logístico y volumen del pedido.',
    ],
  },
  {
    title: 'Tiempos de preparación y entrega',
    bullets: [
      'Preparación: entre 24 y 72 horas hábiles desde la confirmación del pedido.',
      'Entrega estimada AMBA: entre 1 y 4 días hábiles luego de despacho.',
      'Entrega estimada interior del país: entre 3 y 8 días hábiles luego de despacho.',
      'En fechas especiales o alta demanda, los plazos pueden extenderse.',
    ],
  },
  {
    title: 'Costo de envío',
    paragraphs: [
      'El costo se calcula automáticamente en función de destino, peso/volumen y modalidad seleccionada.',
      'Antes de confirmar la compra siempre vas a visualizar el costo final del envío.',
    ],
  },
  {
    title: 'Seguimiento del pedido',
    paragraphs: [
      'Cuando el pedido se despacha te informaremos por correo electrónico para que puedas hacer seguimiento.',
      'Si no recibís novedades dentro del plazo estimado, escribinos por Contacto con tu número de pedido.',
    ],
  },
  {
    title: 'Incidencias de entrega',
    bullets: [
      'Si tu paquete llega dañado, reportalo dentro de las 48 horas de recibido.',
      'Si falta un producto, informalo indicando número de pedido y detalle faltante.',
      'Cada caso se revisa individualmente para ofrecer reposición, devolución o reembolso según corresponda.',
    ],
  },
  {
    title: 'Aclaración importante',
    paragraphs: [
      'Esta información es general y puede actualizarse sin previo aviso para reflejar cambios logísticos u operativos.',
      'Las condiciones específicas aplicables a tu compra son las informadas al momento del checkout.',
    ],
  },
];

export function ShippingPage() {
  return (
    <StaticInfoLayout
      title="Envíos"
      subtitle="Condiciones generales de logística, plazos y seguimiento de pedidos."
      updatedAt="04/04/2026"
      sections={sections}
    />
  );
}
