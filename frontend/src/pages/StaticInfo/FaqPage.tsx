import { StaticInfoLayout, type StaticInfoSection } from './StaticInfoLayout';

const sections: StaticInfoSection[] = [
  {
    title: '¿Necesito crear una cuenta para comprar?',
    paragraphs: [
      'Podés avanzar con la compra completando tus datos en el checkout sin un registro previo tradicional.',
      'Es fundamental que el correo y teléfono sean correctos para poder contactarte por tu pedido.',
    ],
  },
  {
    title: '¿Cómo encuentro productos rápido?',
    paragraphs: [
      'Usá el buscador principal y los filtros de la vista de Productos.',
      'También podés navegar por categorías desde el menú superior o desde el footer.',
    ],
  },
  {
    title: '¿Qué significan las etiquetas Oferta, Novedades y Destacados?',
    paragraphs: [
      'Son agrupaciones comerciales para facilitar el descubrimiento de productos.',
      'Los precios y vigencia de promociones pueden cambiar según disponibilidad y campañas activas.',
    ],
  },
  {
    title: '¿Cómo sé si hay stock?',
    paragraphs: [
      'La disponibilidad visible en la plataforma refleja el estado informado por el sistema al momento de consulta.',
      'Si existe una diferencia de stock posterior a la compra, nuestro equipo te contactará para ofrecer alternativa.',
    ],
  },
  {
    title: '¿Puedo modificar o cancelar un pedido?',
    paragraphs: [
      'Sí, siempre que el pedido no haya ingresado en etapa de despacho.',
      'Contactanos cuanto antes con número de pedido para validar estado y opciones disponibles.',
    ],
  },
  {
    title: '¿Cómo gestiono devoluciones o botón de arrepentimiento?',
    paragraphs: [
      'Encontrás toda la información en las páginas de Legal del footer, incluyendo Botón de arrepentimiento.',
      'Si necesitás asistencia durante el trámite, escribinos desde Contacto.',
    ],
  },
];

export function FaqPage() {
  return (
    <StaticInfoLayout
      title="Preguntas frecuentes"
      subtitle="Respuestas rápidas sobre el uso de la plataforma y el proceso de compra."
      updatedAt="04/04/2026"
      sections={sections}
    />
  );
}
