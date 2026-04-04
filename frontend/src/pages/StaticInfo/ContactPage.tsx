import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Modal } from '../../components/ui/Modal';
import { StaticInfoLayout, type StaticInfoSection } from './StaticInfoLayout';
import styles from './ContactPage.module.css';

interface ContactFormState {
  fullName: string;
  email: string;
  orderNumber: string;
  subject: string;
  message: string;
}

const INITIAL_FORM: ContactFormState = {
  fullName: '',
  email: '',
  orderNumber: '',
  subject: '',
  message: '',
};

const sections: StaticInfoSection[] = [
  {
    title: 'Canales de contacto',
    paragraphs: [
      'Podés escribirnos desde este formulario para consultas sobre pedidos, productos, envíos o gestiones de postventa.',
      'Al enviar la consulta se abrirá tu cliente de correo con el contenido completo para que puedas remitirlo al equipo de atención.',
    ],
  },
  {
    title: 'Tiempo de respuesta estimado',
    bullets: [
      'Consultas generales: hasta 48 horas hábiles.',
      'Incidencias de pedido en curso: prioridad alta.',
      'Reclamos con evidencia adjunta: se revisan por orden de ingreso.',
    ],
  },
];

function buildMailToLink(toEmail: string, form: ContactFormState) {
  const subject = form.subject.trim() || 'Consulta desde Allmart';
  const bodyLines = [
    `Nombre: ${form.fullName.trim()}`,
    `Email de contacto: ${form.email.trim()}`,
    `Numero de pedido: ${form.orderNumber.trim() || 'No informado'}`,
    '',
    'Mensaje:',
    form.message.trim(),
  ];

  const body = bodyLines.join('\n');
  return `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ContactPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [form, setForm] = useState<ContactFormState>(INITIAL_FORM);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const contactEmail = useMemo(() => {
    const configured = import.meta.env.VITE_CONTACT_EMAIL;
    if (typeof configured === 'string' && configured.trim()) {
      return configured.trim();
    }
    return 'contacto@allmart.com.ar';
  }, []);

  const isValid =
    form.fullName.trim().length > 2 &&
    form.email.trim().includes('@') &&
    form.message.trim().length >= 10;

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValid) {
      setStatusMessage('Completá nombre, email válido y un mensaje de al menos 10 caracteres.');
      return;
    }

    const mailtoLink = buildMailToLink(contactEmail, form);
    window.location.href = mailtoLink;
    setStatusMessage('Se abrió tu cliente de correo para enviar la consulta al equipo de Allmart.');
    setIsModalOpen(false);
    setForm(INITIAL_FORM);
  };

  return (
    <StaticInfoLayout
      title="Contacto"
      subtitle="Estamos para ayudarte. Escribinos por compras, envíos, devoluciones o consultas generales."
      updatedAt="04/04/2026"
      sections={sections}
    >
      <div className={styles.actionsRow}>
        <button type="button" className={styles.primaryButton} onClick={() => setIsModalOpen(true)}>
          Abrir formulario de contacto
        </button>
      </div>

      {statusMessage ? <p className={styles.statusBox}>{statusMessage}</p> : null}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enviar consulta"
        showCloseButton
        size="md"
      >
        <form className={styles.formGrid} onSubmit={handleSubmit}>
          <p className={styles.helperText}>
            El correo será enviado a <span className={styles.emailText}>{contactEmail}</span>
          </p>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="contact-full-name">
              Nombre y apellido
            </label>
            <input
              id="contact-full-name"
              className={styles.fieldInput}
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="contact-email">
              Correo electrónico
            </label>
            <input
              id="contact-email"
              className={styles.fieldInput}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="contact-order-number">
              Numero de pedido (opcional)
            </label>
            <input
              id="contact-order-number"
              className={styles.fieldInput}
              name="orderNumber"
              type="text"
              value={form.orderNumber}
              onChange={handleChange}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="contact-subject">
              Asunto
            </label>
            <input
              id="contact-subject"
              className={styles.fieldInput}
              name="subject"
              type="text"
              value={form.subject}
              onChange={handleChange}
              placeholder="Ej: Consulta por envio"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="contact-message">
              Mensaje
            </label>
            <textarea
              id="contact-message"
              className={styles.fieldTextarea}
              name="message"
              value={form.message}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setIsModalOpen(false)}>
              Cerrar
            </button>
            <button type="submit" className={styles.primaryButton}>
              Enviar por correo
            </button>
          </div>
        </form>
      </Modal>
    </StaticInfoLayout>
  );
}
