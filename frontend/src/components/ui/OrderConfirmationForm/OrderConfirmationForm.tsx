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

interface OrderConfirmationFormProps {
  totalPrice: number;
  onConfirm: (data: OrderFormData) => void;
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
  onConfirm,
  onCancel,
}: OrderConfirmationFormProps) {
  const [form, setForm] = useState<OrderFormData>({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    /* Guardar en localStorage */
    try {
      localStorage.setItem(ORDER_FORM_STORAGE_KEY, JSON.stringify(form));
    } catch {
      /* sin acceso a localStorage */
    }

    onConfirm(form);
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

        {/* ── Formulario ── */}
        <form
          className={styles.form}
          onSubmit={handleSubmit}
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
            <button type="submit" className={styles.confirmBtn}>
              Confirmar pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
