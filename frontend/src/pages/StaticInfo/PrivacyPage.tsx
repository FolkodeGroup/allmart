import { StaticInfoLayout, type StaticInfoSection } from './StaticInfoLayout';

const sections: StaticInfoSection[] = [
  {
    title: '1) Alcance de esta política',
    paragraphs: [
      'Esta política describe cómo ALLMART recolecta, usa, conserva y protege datos personales en su sitio web y canales asociados.',
      'Se aplica a usuarios que navegan, consultan productos, realizan compras o se contactan mediante formularios.',
    ],
  },
  {
    title: '2) Datos personales que podemos recopilar',
    bullets: [
      'Datos de identificación y contacto: nombre, apellido, correo electrónico y teléfono.',
      'Datos de compra y entrega: dirección, referencia de pedido y datos operativos de envío.',
      'Datos técnicos de uso: dispositivo, navegador, IP aproximada, páginas visitadas y eventos de navegación.',
      'Información aportada por el usuario en consultas, reclamos o formularios de contacto.',
    ],
  },
  {
    title: '3) Finalidades del tratamiento',
    bullets: [
      'Procesar compras, coordinar entregas y brindar soporte postventa.',
      'Gestionar consultas, reclamos, cambios, devoluciones y revocaciones.',
      'Mejorar la experiencia de navegación, seguridad y rendimiento del sitio.',
      'Cumplir obligaciones legales y regulatorias aplicables.',
      'Enviar comunicaciones transaccionales y, cuando corresponda, comunicaciones comerciales.',
    ],
  },
  {
    title: '4) Base legal y consentimiento',
    paragraphs: [
      'El tratamiento se realiza con base en la ejecución de la relación de consumo, cumplimiento de obligaciones legales y, cuando aplica, consentimiento del titular.',
      'Los datos se tratarán conforme a la Ley 25.326 de Protección de Datos Personales y normativa complementaria.',
    ],
  },
  {
    title: '5) Conservación de los datos',
    paragraphs: [
      'Conservamos los datos solo durante el plazo necesario para cumplir las finalidades indicadas y obligaciones legales aplicables.',
      'Cuando los datos dejan de ser necesarios, se suprimen o anonimizan de forma segura.',
    ],
  },
  {
    title: '6) Cesión y proveedores terceros',
    paragraphs: [
      'Podemos compartir datos estrictamente necesarios con operadores logísticos, pasarelas de pago, proveedores tecnológicos o servicios de soporte.',
      'En todos los casos exigimos obligaciones de confidencialidad y medidas de seguridad adecuadas.',
    ],
  },
  {
    title: '7) Cookies y tecnologías similares',
    bullets: [
      'Utilizamos cookies técnicas necesarias para el funcionamiento del sitio.',
      'Podemos usar cookies analíticas para medir tráfico y mejorar usabilidad.',
      'El usuario puede configurar su navegador para bloquear o eliminar cookies, con posible impacto en funcionalidades.',
    ],
  },
  {
    title: '8) Derechos del titular de datos',
    paragraphs: [
      'Podés ejercer tus derechos de acceso, rectificación, actualización y supresión conforme la Ley 25.326.',
      'Para ejercerlos, escribinos por los canales de contacto informando identidad y detalle del pedido.',
    ],
    bullets: [
      'Solicitar acceso a tus datos personales.',
      'Pedir corrección de datos inexactos o incompletos.',
      'Solicitar la supresión cuando corresponda legalmente.',
      'Revocar consentimiento para comunicaciones promocionales.',
    ],
  },
  {
    title: '9) Seguridad de la información',
    paragraphs: [
      'Aplicamos medidas técnicas y organizativas razonables para proteger los datos contra acceso no autorizado, pérdida o alteración.',
      'Ningún sistema es absolutamente invulnerable, por lo que se implementa mejora continua de controles.',
    ],
  },
  {
    title: '10) Menores de edad y cambios de política',
    paragraphs: [
      'Este sitio no está dirigido a menores de edad sin supervisión de sus representantes legales.',
      'Podemos actualizar esta política para reflejar cambios normativos o de operación; la versión vigente será la publicada en esta página.',
    ],
  },
];

export function PrivacyPage() {
  return (
    <StaticInfoLayout
      title="Política de privacidad"
      subtitle="Tratamiento de datos personales y derechos de usuarios en ALLMART."
      updatedAt="04/04/2026"
      sections={sections}
    />
  );
}
