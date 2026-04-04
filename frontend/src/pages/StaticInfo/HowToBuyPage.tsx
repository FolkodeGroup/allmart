import { StaticInfoLayout, type StaticInfoSection } from './StaticInfoLayout';

const sections: StaticInfoSection[] = [
  {
    title: '1) Explorá el catálogo',
    paragraphs: [
      'Ingresá a Productos desde el menú principal o desde el footer para ver todo el catálogo.',
      'Podés usar filtros por categoría, subcategoría, etiquetas y ordenar por relevancia o precio.',
    ],
  },
  {
    title: '2) Elegí tu producto',
    paragraphs: [
      'Al abrir un producto vas a ver imágenes, descripción, precio, disponibilidad y variantes si aplica.',
      'Seleccioná la variante deseada y la cantidad antes de agregar al carrito.',
    ],
  },
  {
    title: '3) Revisá tu carrito',
    paragraphs: [
      'Entrá en Carrito para confirmar productos, cantidades y subtotales.',
      'Si necesitás corregir algo, podés modificar cantidades o eliminar productos antes de confirmar.',
    ],
  },
  {
    title: '4) Confirmá tus datos de compra',
    paragraphs: [
      'Completá el formulario de checkout con datos de contacto, entrega y observaciones del pedido.',
      'Verificá cuidadosamente correo electrónico y teléfono para recibir comunicaciones del pedido.',
    ],
  },
  {
    title: '5) Confirmación del pedido',
    paragraphs: [
      'Una vez enviada la solicitud, te mostramos una confirmación en pantalla con el resumen de la operación.',
      'Conservá el número de pedido para consultas, seguimiento o gestiones de postventa.',
    ],
  },
  {
    title: '6) Soporte postcompra',
    paragraphs: [
      'Si necesitás ayuda con envío, cambios o cancelaciones, podés escribirnos desde la sección Contacto.',
    ],
    bullets: [
      'Tené a mano tu número de pedido.',
      'Indicá claramente el motivo de la consulta.',
      'Adjuntá fotos si reportás un producto dañado o incompleto.',
    ],
  },
];

export function HowToBuyPage() {
  return (
    <StaticInfoLayout
      title="Cómo comprar"
      subtitle="Guía rápida para comprar en Allmart de forma simple y segura."
      updatedAt="04/04/2026"
      sections={sections}
    />
  );
}
