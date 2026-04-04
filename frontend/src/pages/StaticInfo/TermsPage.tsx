import { StaticInfoLayout, type StaticInfoSection } from './StaticInfoLayout';

const sections: StaticInfoSection[] = [
  {
    title: '1) Identificación del proveedor',
    paragraphs: [
      'Este sitio es operado por ALLMART. Antes de su publicación comercial definitiva, deben completarse razón social, CUIT, domicilio legal y canales formales de atención.',
      'La información de identificación será exhibida de forma clara en cumplimiento del deber de información al consumidor.',
    ],
  },
  {
    title: '2) Aceptación de estos términos',
    paragraphs: [
      'Al navegar, registrarte o comprar en esta tienda aceptás estos Términos y Condiciones y la Política de Privacidad vigente.',
      'Si no estás de acuerdo con alguna condición, podés abstenerte de utilizar la plataforma.',
    ],
  },
  {
    title: '3) Productos, precios y disponibilidad',
    bullets: [
      'Las imágenes y descripciones de productos son de carácter ilustrativo e informativo.',
      'Los precios se expresan en pesos argentinos e incluyen los impuestos aplicables, salvo indicación expresa.',
      'La disponibilidad de stock se actualiza en forma dinámica y puede variar por simultaneidad de operaciones.',
      'Nos reservamos el derecho de corregir errores materiales de publicación, informando al usuario antes de perfeccionar la operación.',
    ],
  },
  {
    title: '4) Proceso de compra y confirmación',
    paragraphs: [
      'La operación se considera recibida cuando el usuario completa el checkout y visualiza la confirmación en pantalla.',
      'La validación final del pedido puede requerir controles internos de stock, datos o medios de pago.',
    ],
  },
  {
    title: '5) Envíos y entregas',
    paragraphs: [
      'Los plazos de despacho y entrega son estimados y pueden variar por logística, localidad, condiciones climáticas o fuerza mayor.',
      'Las condiciones de envío aplicables a cada compra se informan durante el proceso de checkout.',
    ],
  },
  {
    title: '6) Cambios, devoluciones y revocación',
    paragraphs: [
      'El usuario podrá solicitar cambios o devoluciones según la normativa vigente y las políticas operativas publicadas.',
      'En contrataciones a distancia, el consumidor tiene derecho a revocar la aceptación dentro de los 10 días corridos, conforme artículo 34 de la Ley 24.240 y artículo 1110 del Código Civil y Comercial.',
      'La gestión de revocación puede iniciarse desde la sección Botón de arrepentimiento disponible en el footer.',
    ],
  },
  {
    title: '7) Garantía legal',
    paragraphs: [
      'Los productos comercializados cuentan con la garantía legal aplicable según la Ley 24.240 y normas complementarias.',
      'La garantía no cubre daños derivados de uso indebido, manipulación incorrecta o desgaste normal del producto.',
    ],
  },
  {
    title: '8) Propiedad intelectual',
    bullets: [
      'Todos los contenidos del sitio (textos, logos, diseños, imágenes y código) son propiedad de ALLMART o de sus titulares licenciantes.',
      'Queda prohibida su reproducción total o parcial sin autorización previa y expresa.',
    ],
  },
  {
    title: '9) Responsabilidad y uso del sitio',
    paragraphs: [
      'El usuario se compromete a utilizar la plataforma de buena fe y conforme al ordenamiento legal vigente.',
      'ALLMART no será responsable por interrupciones del servicio causadas por terceros, mantenimiento o contingencias fuera de su control razonable.',
    ],
  },
  {
    title: '10) Jurisdicción y modificaciones',
    paragraphs: [
      'Estos términos se rigen por las leyes de la República Argentina.',
      'Toda controversia será sometida a la jurisdicción competente que corresponda conforme normativa de defensa del consumidor.',
      'ALLMART podrá actualizar estos términos cuando resulte necesario. La versión vigente se publica en esta misma página.',
    ],
  },
];

export function TermsPage() {
  return (
    <StaticInfoLayout
      title="Términos y condiciones"
      subtitle="Condiciones de uso, compra y contratación aplicables al sitio de ecommerce ALLMART."
      updatedAt="04/04/2026"
      sections={sections}
    />
  );
}
