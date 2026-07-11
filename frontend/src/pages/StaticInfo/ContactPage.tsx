import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, FocusEvent } from 'react';
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

  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const [touchedFields, setTouchedFields] = useState({
    fullName: false,
    email: false,
    message: false,
  });

  const [submitAttempted, setSubmitAttempted] = useState(false);

  const getFieldError = (field: 'fullName' | 'email' | 'message', value: string) => {
    const trimmed = value.trim();
    if (field === 'fullName') {
      if (trimmed.length === 0) return 'Ingresá tu nombre y apellido.';
      if (trimmed.length < 3) return 'El nombre debe tener al menos 3 caracteres.';
      return '';
    }
    if (field === 'email') {
      if (trimmed.length === 0) return 'Ingresá tu correo electrónico.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Ingresá un correo válido.';
      return '';
    }
    if (field === 'message') {
      if (trimmed.length === 0) return 'Ingresá tu mensaje.';
      if (trimmed.length < 10) return 'El mensaje debe tener al menos 10 caracteres.';
      return '';
    }
    return '';
  };

  const fieldErrors = {
    fullName: getFieldError('fullName', form.fullName),
    email: getFieldError('email', form.email),
    message: getFieldError('message', form.message),
  };

  const isFormValid = !fieldErrors.fullName && !fieldErrors.email && !fieldErrors.message;

  const getFieldStatus = (field: 'fullName' | 'email' | 'message') => {
    const error = fieldErrors[field];
    if (error && (touchedFields[field] || submitAttempted)) return 'invalid';
    if (!error && (touchedFields[field] || submitAttempted)) return 'valid';
    return undefined;
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (submitAttempted || name === 'fullName' || name === 'email' || name === 'message') {
      setTouchedFields((prev) => ({ ...prev, [name]: true }));
    }
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = event.target;
    if (name === 'fullName' || name === 'email' || name === 'message') {
      setTouchedFields((prev) => ({ ...prev, [name]: true }));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setTouchedFields({ fullName: true, email: true, message: true });

    if (!isFormValid) {
      if (fieldErrors.fullName) {
        fullNameRef.current?.focus();
      } else if (fieldErrors.email) {
        emailRef.current?.focus();
      } else if (fieldErrors.message) {
        messageRef.current?.focus();
      }
      return;
    }

    const mailtoLink = buildMailToLink(contactEmail, form);
    window.location.href = mailtoLink;
    setStatusMessage('Se abrió tu cliente de correo para enviar la consulta al equipo de Allmart.');
    setIsModalOpen(false);
    setForm(INITIAL_FORM);
    setTouchedFields({ fullName: false, email: false, message: false });
    setSubmitAttempted(false);
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
        ariaDescribedBy="contact-form-note"
      >
        <form className={styles.formGrid} onSubmit={handleSubmit} noValidate aria-describedby="contact-form-note">
          <p id="contact-form-note" className={styles.helperText}>
            El correo será enviado a <span className={styles.emailText}>{contactEmail}</span>
          </p>
          <p className={styles.requiredNote}>
            <span className={styles.requiredMarker}>*</span> Campos obligatorios
          </p>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="contact-full-name">
              Nombre y apellido <span className={styles.requiredMarker}>*</span>
            </label>
            <div className={styles.fieldControl}>
              <input
                id="contact-full-name"
                className={`${styles.fieldInput} ${getFieldStatus('fullName') === 'valid' ? styles.fieldValid : ''} ${getFieldStatus('fullName') === 'invalid' ? styles.fieldInvalid : ''}`}
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Tu nombre completo"
                required
                aria-required="true"
                aria-invalid={getFieldStatus('fullName') === 'invalid'}
                aria-describedby={fieldErrors.fullName && (touchedFields.fullName || submitAttempted) ? 'contact-full-name-error' : undefined}
                ref={fullNameRef}
              />
              {(getFieldStatus('fullName') === 'valid' || getFieldStatus('fullName') === 'invalid') && (
                <span className={`${styles.validationIcon} ${getFieldStatus('fullName') === 'valid' ? styles.validationIconValid : styles.validationIconInvalid}`}>
                  {getFieldStatus('fullName') === 'valid' ? '✓' : '⚠'}
                </span>
              )}
            </div>
            {fieldErrors.fullName && (touchedFields.fullName || submitAttempted) && (
              <span id="contact-full-name-error" className={styles.fieldError} role="alert">
                {fieldErrors.fullName}
              </span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="contact-email">
              Correo electrónico <span className={styles.requiredMarker}>*</span>
            </label>
            <div className={styles.fieldControl}>
              <input
                id="contact-email"
                className={`${styles.fieldInput} ${getFieldStatus('email') === 'valid' ? styles.fieldValid : ''} ${getFieldStatus('email') === 'invalid' ? styles.fieldInvalid : ''}`}
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="tu@email.com"
                required
                aria-required="true"
                aria-invalid={getFieldStatus('email') === 'invalid'}
                aria-describedby={fieldErrors.email && (touchedFields.email || submitAttempted) ? 'contact-email-error' : undefined}
                ref={emailRef}
              />
              {(getFieldStatus('email') === 'valid' || getFieldStatus('email') === 'invalid') && (
                <span className={`${styles.validationIcon} ${getFieldStatus('email') === 'valid' ? styles.validationIconValid : styles.validationIconInvalid}`}>
                  {getFieldStatus('email') === 'valid' ? '✓' : '⚠'}
                </span>
              )}
            </div>
            {fieldErrors.email && (touchedFields.email || submitAttempted) && (
              <span id="contact-email-error" className={styles.fieldError} role="alert">
                {fieldErrors.email}
              </span>
            )}
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
              placeholder="Ej: 123456"
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
              placeholder="Ej: Consulta por envío"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="contact-message">
              Mensaje <span className={styles.requiredMarker}>*</span>
            </label>
            <div className={styles.fieldControl}>
              <textarea
                id="contact-message"
                className={`${styles.fieldTextarea} ${getFieldStatus('message') === 'valid' ? styles.fieldValid : ''} ${getFieldStatus('message') === 'invalid' ? styles.fieldInvalid : ''}`}
                name="message"
                value={form.message}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Contanos cómo podemos ayudarte..."
                required
                aria-required="true"
                aria-invalid={getFieldStatus('message') === 'invalid'}
                aria-describedby={fieldErrors.message && (touchedFields.message || submitAttempted) ? 'contact-message-error' : undefined}
                ref={messageRef}
              />
              {(getFieldStatus('message') === 'valid' || getFieldStatus('message') === 'invalid') && (
                <span className={`${styles.validationIcon} ${getFieldStatus('message') === 'valid' ? styles.validationIconValid : styles.validationIconInvalid}`}>
                  {getFieldStatus('message') === 'valid' ? '✓' : '⚠'}
                </span>
              )}
            </div>
            {fieldErrors.message && (touchedFields.message || submitAttempted) && (
              <span id="contact-message-error" className={styles.fieldError} role="alert">
                {fieldErrors.message}
              </span>
            )}
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
