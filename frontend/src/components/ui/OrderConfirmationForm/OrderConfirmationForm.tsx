import { useState, useEffect, useRef } from 'react';
import styles from './OrderConfirmationForm.module.css';

/* ── Tipos ── */
export interface OrderFormData {
  firstName: string;
  lastName: string;
  email: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
}

import type { CartItem } from '../../../types';
import { buildWhatsAppMessage, buildWhatsAppUrl } from '../../../utils/whatsapp';

interface OrderConfirmationFormProps {
  totalPrice: number;
  cartItems: CartItem[];
  onCartClear: () => void;
  onCancel: () => void;
}

/* ── Clave para localStorage ── */
const ORDER_FORM_STORAGE_KEY = 'allmart_order_form';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(price);
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function OrderConfirmationForm({
  totalPrice,
  cartItems,
  onCartClear,
  onCancel,
}: OrderConfirmationFormProps) {
  const [form, setForm] = useState<OrderFormData>({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  /* Foco inicial al montar */
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  /* Cerrar con Escape */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  /* Bloquear scroll del body mientras el modal está abierto */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  function validate(data: OrderFormData): FormErrors {
    const errs: FormErrors = {};
    if (!data.firstName.trim()) errs.firstName = 'El nombre es obligatorio.';
    if (!data.lastName.trim()) errs.lastName = 'El apellido es obligatorio.';
    if (!data.email.trim()) {
      errs.email = 'El email es obligatorio.';
    } else if (!validateEmail(data.email)) {
      errs.email = 'Ingresá un email válido.';
    }
    return errs;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    /* Limpiar error del campo en tiempo real si ya se intentó enviar */
    if (submitted) {
      setErrors(validate(updated));
    }
  }

  function handleWhatsApp(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setProcessing(true);
    // Simular procesamiento (mock)
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      // Guardar en localStorage
      try {
        localStorage.setItem(ORDER_FORM_STORAGE_KEY, JSON.stringify(form));
      } catch {}
      // Limpiar carrito
      onCartClear();
      // Mostrar feedback visual por 2 segundos, luego abrir WhatsApp y cerrar modal
      setTimeout(() => {
        // Construir mensaje y URL de WhatsApp
        const whatsappMessage = buildWhatsAppMessage(form, cartItems, totalPrice);
        const whatsappUrl = buildWhatsAppUrl(whatsappMessage);
        window.open(whatsappUrl, '_blank');
        onCancel();
      }, 2000);
    }, 1500);
  }

  /* Click fuera del panel cierra el modal */
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onCancel();
  }

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-form-title"
    >
      <div className={styles.panel} ref={dialogRef}>
        {/* ── Cabecera ── */}
        <div className={styles.header}>
          <h2 id="order-form-title" className={styles.title}>
            Confirmá tu pedido
          </h2>
          <button
            className={styles.closeBtn}
            onClick={onCancel}
            aria-label="Cerrar formulario"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* ── Total resumen ── */}
        <div className={styles.totalBadge}>
          <span className={styles.totalLabel}>Total a pagar</span>
          <span className={styles.totalAmount}>{formatPrice(totalPrice)}</span>
        </div>

        {/* ── Mock de procesamiento y feedback visual ── */}
        {processing && (
          <div className={styles.processing} style={{ textAlign: 'center', padding: '2rem' }}>
            <div className={styles.spinner} style={{ margin: '0 auto 1rem', width: 32, height: 32, border: '4px solid #eee', borderTop: '4px solid #25d366', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p>Procesando pedido...</p>
          </div>
        )}
        {success && (
          <div className={styles.success} style={{ textAlign: 'center', padding: '2rem' }}>
            <span style={{ fontSize: 32, color: '#25d366' }} role="img" aria-label="Pedido enviado">✅</span>
            <p style={{ marginTop: 16, fontWeight: 'bold' }}>¡Pedido enviado por WhatsApp!</p>
          </div>
        )}
        {!processing && !success && (
          <form
            className={styles.form}
            onSubmit={handleWhatsApp}
            noValidate
            aria-label="Datos del comprador"
          >
            {/* Nombre */}
            <div className={styles.fieldGroup}>
              <label htmlFor="firstName" className={styles.label}>
                Nombre <span aria-hidden="true" className={styles.required}>*</span>
              </label>
              <input
                ref={firstInputRef}
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
                value={form.firstName}
                onChange={handleChange}
                placeholder="Ej: María"
                aria-required="true"
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                aria-invalid={!!errors.firstName}
              />
              {errors.firstName && (
                <span id="firstName-error" className={styles.errorMsg} role="alert">
                  {errors.firstName}
                </span>
              )}
            </div>

            {/* Apellido */}
            <div className={styles.fieldGroup}>
              <label htmlFor="lastName" className={styles.label}>
                Apellido <span aria-hidden="true" className={styles.required}>*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
                value={form.lastName}
                onChange={handleChange}
                placeholder="Ej: González"
                aria-required="true"
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                aria-invalid={!!errors.lastName}
              />
              {errors.lastName && (
                <span id="lastName-error" className={styles.errorMsg} role="alert">
                  {errors.lastName}
                </span>
              )}
            </div>

            {/* Email */}
            <div className={styles.fieldGroup}>
              <label htmlFor="email" className={styles.label}>
                Email <span aria-hidden="true" className={styles.required}>*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                value={form.email}
                onChange={handleChange}
                placeholder="Ej: maria@correo.com"
                aria-required="true"
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <span id="email-error" className={styles.errorMsg} role="alert">
                  {errors.email}
                </span>
              )}
            </div>

            {/* ── Acciones ── */}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onCancel}
              >
                Volver al carrito
              </button>
              <button type="submit" className={styles.confirmBtn} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#25d366' }}>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" width="20" height="20" style={{ marginRight: 4 }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Confirmar pedido
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
