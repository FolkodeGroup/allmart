import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { StaticInfoLayout, type StaticInfoSection } from './StaticInfoLayout';
import styles from './WithdrawalPage.module.css';

interface WithdrawalFormState {
  fullName: string;
  email: string;
  orderNumber: string;
  purchaseDate: string;
  reason: string;
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

function generateRequestCode() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ARREP-${datePart}-${randomPart}`;
}

export function WithdrawalPage() {
  const [form, setForm] = useState<WithdrawalFormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [requestCode, setRequestCode] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.fullName.trim().length < 3) {
      setError('Indicá nombre y apellido válidos.');
      return;
    }

    if (!form.email.trim().includes('@')) {
      setError('Ingresá un correo electrónico válido.');
      return;
    }

    if (!form.orderNumber.trim() && !form.purchaseDate.trim()) {
      setError('Ingresá número de pedido o fecha de compra para identificar la operación.');
      return;
    }

    const code = generateRequestCode();
    setRequestCode(code);
    setError(null);

    try {
      const existing = localStorage.getItem('allmart-withdrawal-requests');
      const parsed = existing ? JSON.parse(existing) : [];
      const nextRecord = {
        ...form,
        requestCode: code,
        createdAt: new Date().toISOString(),
      };
      const next = Array.isArray(parsed) ? [nextRecord, ...parsed].slice(0, 25) : [nextRecord];
      localStorage.setItem('allmart-withdrawal-requests', JSON.stringify(next));
    } catch {
      // El guardado local es complementario; no bloquea el tramite.
    }

    setForm(INITIAL_FORM);
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

        <form className={styles.formGrid} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="withdrawal-full-name">
              Nombre y apellido
            </label>
            <input
              id="withdrawal-full-name"
              className={styles.fieldInput}
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="withdrawal-email">
              Correo electrónico
            </label>
            <input
              id="withdrawal-email"
              className={styles.fieldInput}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="withdrawal-order-number">
              Número de pedido (recomendado)
            </label>
            <input
              id="withdrawal-order-number"
              className={styles.fieldInput}
              name="orderNumber"
              type="text"
              value={form.orderNumber}
              onChange={handleChange}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="withdrawal-purchase-date">
              Fecha de compra (si no tenés número de pedido)
            </label>
            <input
              id="withdrawal-purchase-date"
              className={styles.fieldInput}
              name="purchaseDate"
              type="date"
              value={form.purchaseDate}
              onChange={handleChange}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="withdrawal-reason">
              Motivo (opcional)
            </label>
            <textarea
              id="withdrawal-reason"
              className={styles.fieldTextarea}
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="Podés indicar detalle adicional para agilizar la gestión"
            />
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.submitButton}>
              Enviar solicitud
            </button>
          </div>
        </form>

        {error ? <p className={styles.errorBox}>{error}</p> : null}

        {requestCode ? (
          <div className={styles.successBox}>
            Solicitud registrada correctamente.
            <br />
            Código de gestión:
            <br />
            <span className={styles.code}>{requestCode}</span>
          </div>
        ) : null}
      </div>
    </StaticInfoLayout>
  );
}
