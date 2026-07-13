import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent, FocusEvent } from 'react';
import { StaticInfoLayout, type StaticInfoSection } from './StaticInfoLayout';
import { contactsService } from '../../services/contactsService';
import styles from './WithdrawalPage.module.css';

interface WithdrawalFormState {
  fullName: string;
  email: string;
  orderNumber: string;
  purchaseDate: string;
  reason: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  orderNumber?: string;
  purchaseDate?: string;
}

const INITIAL_FORM: WithdrawalFormState = {
  fullName: '',
  email: '',
  orderNumber: '',
  purchaseDate: '',
  reason: '',
};

const sections: StaticInfoSection[] = [
  {
    title: 'Derecho de revocación en compras a distancia',
    paragraphs: [
      'Si contrataste por medios electrónicos, podés revocar la aceptación dentro de los 10 días corridos desde la entrega del bien o la celebración del contrato, lo que ocurra último.',
      'Este derecho se reconoce conforme artículo 34 de la Ley 24.240 y artículo 1110 del Código Civil y Comercial.',
    ],
  },
  {
    title: 'Cómo funciona este botón',
    bullets: [
      'Completás el formulario con tus datos y referencia de compra.',
      'La plataforma genera de forma inmediata un código de gestión de arrepentimiento.',
      'Conservá ese código para seguimiento por soporte.',
      'No se te pedirá registración previa para iniciar este trámite.',
    ],
  },
  {
    title: 'Plazos de gestión',
    paragraphs: [
      'Después de enviar la solicitud, el equipo de atención validará la operación y te contactará por correo electrónico con los pasos de devolución/reintegro según corresponda.',
      'El proveedor debe comunicar constancia de la revocación por el mismo medio en un plazo razonable, conforme normativa aplicable.',
    ],
  },
];

export function WithdrawalPage() {
  const [form, setForm] = useState<WithdrawalFormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [requestCode, setRequestCode] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  // Ejecuta las validaciones en tiempo real de forma segura para ESLint
  useEffect(() => {
    const newErrors: FormErrors = {};

    // 1. Nombre completo
    if (!form.fullName.trim()) {
      newErrors.fullName = 'El nombre y apellido son obligatorios.';
    } else if (form.fullName.trim().length < 3) {
      newErrors.fullName = 'El nombre debe tener al menos 3 caracteres.';
    }

    // 2. Correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = 'Ingresá un correo electrónico con formato válido (ej@correo.com).';
    }

    // 3. Número de pedido
    if (!form.orderNumber.trim()) {
      newErrors.orderNumber = 'El número de pedido es obligatorio.';
    }

    // 4. Fecha de compra
    if (!form.purchaseDate) {
      newErrors.purchaseDate = 'La fecha de compra es obligatoria.';
    } else {
      const selectedDate = new Date(form.purchaseDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(24, 0, 0, 0); // Ajuste por timezone offset local

      if (isNaN(selectedDate.getTime())) {
        newErrors.purchaseDate = 'La fecha ingresada es inválida.';
      } else if (selectedDate > today) {
        newErrors.purchaseDate = 'La fecha de compra no puede ser futura.';
      }
    }

    setErrors(newErrors);
    
    const hasErrors = Object.keys(newErrors).length > 0;
    const hasRequiredValues = !!(form.fullName && form.email && form.orderNumber && form.purchaseDate);
    setIsFormValid(!hasErrors && hasRequiredValues);
  }, [form]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Forzamos que se muestren todos los errores si intentaran enviar a la fuerza
    const allTouched = Object.keys(form).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);

    if (!isFormValid) {
      setSubmitError('Por favor, corregí los campos obligatorios antes de enviar.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setRequestCode(null);

    try {
      const response = await contactsService.submitWithdrawal({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        orderNumber: form.orderNumber.trim(),
        purchaseDate: form.purchaseDate,
        reason: form.reason.trim(),
      });

      setRequestCode(response.trackingCode);
      setForm(INITIAL_FORM);
      setTouched({});
    } catch (err) {
      // Solución definitiva al warning del 'any' usando verificación de instancia
      const errorMessage = err instanceof Error ? err.message : 'Hubo un problema al procesar tu solicitud. Intentá de nuevo.';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasErrorClass = (fieldName: keyof FormErrors) => {
    return touched[fieldName] && errors[fieldName] ? styles.inputError : '';
  };

  return (
    <StaticInfoLayout
      title="Botón de arrepentimiento"
      subtitle="Solicitá la revocación de compras a distancia de manera simple y directa."
      updatedAt="04/04/2026"
      sections={sections}
    >
      <div className={styles.introCard}>
        <p className={styles.introText}>
          Este formulario genera una constancia inmediata de solicitud de revocación. Guardá el código que
          se te mostrará al enviarlo.
        </p>
      </div>

      <div className={styles.formCard}>
        <h2 className={styles.formTitle}>Formulario de revocación</h2>

        <form className={styles.formGrid} onSubmit={handleSubmit} noValidate>
          {/* Nombre y Apellido */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="withdrawal-full-name">
              Nombre y apellido *
            </label>
            <input
              id="withdrawal-full-name"
              className={`${styles.regretfieldInput} ${hasErrorClass('fullName')}`}
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {touched.fullName && errors.fullName && (
              <span className={styles.errorMessage}>{errors.fullName}</span>
            )}
          </div>

          {/* Correo electrónico */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="withdrawal-email">
              Correo electrónico *
            </label>
            <input
              id="withdrawal-email"
              className={`${styles.regretfieldInput} ${hasErrorClass('email')}`}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {touched.email && errors.email && (
              <span className={styles.errorMessage}>{errors.email}</span>
            )}
          </div>

          {/* Número de pedido */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="withdrawal-order-number">
              Número de pedido *
            </label>
            <input
              id="withdrawal-order-number"
              className={`${styles.regretfieldInput} ${hasErrorClass('orderNumber')}`}
              name="orderNumber"
              type="text"
              value={form.orderNumber}
              placeholder="Ej: ORD-2026-987"
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {touched.orderNumber && errors.orderNumber && (
              <span className={styles.errorMessage}>{errors.orderNumber}</span>
            )}
          </div>

          {/* Fecha de compra */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="withdrawal-purchase-date">
              Fecha de compra *
            </label>
            <input
              id="withdrawal-purchase-date"
              className={`${styles.regretfieldInput} ${hasErrorClass('purchaseDate')}`}
              name="purchaseDate"
              type="date"
              value={form.purchaseDate}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {touched.purchaseDate && errors.purchaseDate && (
              <span className={styles.errorMessage}>{errors.purchaseDate}</span>
            )}
          </div>

          {/* Motivo (Opcional) */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="withdrawal-reason">
              Motivo (opcional)
            </label>
            <textarea
              id="withdrawal-reason"
              className={styles.regretfieldTextarea}
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="Podés indicar detalle adicional para agilizar la gestión"
            />
          </div>

          <div className={styles.formActions}>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </form>

        {submitError && <p className={styles.errorBox}>{submitError}</p>}

        {requestCode && (
          <div className={styles.successBox}>
            Solicitud registrada correctamente.
            <br />
            Código de gestión:
            <br />
            <span className={styles.code}>{requestCode}</span>
          </div>
        )}
      </div>
    </StaticInfoLayout>
  );
}