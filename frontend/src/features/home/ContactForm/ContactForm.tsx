import { useState } from 'react';
import type { ChangeEvent, FormEvent, FocusEvent } from 'react';
import styles from './ContactForm.module.css';
import { contactsService } from '../../../services/contactsService';

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Validaciones en tiempo real derivadas del estado actual
  const nameError = formData.name.trim().length > 0 && formData.name.trim().length < 2
    ? 'El nombre debe tener al menos 2 caracteres.'
    : '';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailError = formData.email.trim().length > 0 && !emailRegex.test(formData.email.trim())
    ? 'Ingresá un correo electrónico válido.'
    : '';

  const messageError = formData.message.trim().length > 0 && formData.message.trim().length < 10
    ? 'El mensaje debe tener al menos 10 caracteres.'
    : '';

  // El formulario es válido solo si no hay errores activos y los campos requeridos tienen contenido
  const isFormValid =
    !nameError &&
    !emailError &&
    !messageError &&
    formData.name.trim().length >= 2 &&
    emailRegex.test(formData.email.trim()) &&
    formData.message.trim().length >= 10;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Al tipear, marcamos el campo como tocado para dar feedback inmediato
    setTouched(prev => ({ ...prev, [name]: true }));
    if (error) setError(null);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await contactsService.submitContact({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim() || undefined,
        message: formData.message.trim(),
      });

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTouched({}); // Limpiamos los campos tocados

      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error al enviar el mensaje. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.section} aria-label="Formulario de contacto">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.label}>Conecta con nosotros</span>
          <h2 className={styles.title}>¿Preguntas o sugerencias?</h2>
          <p className={styles.subtitle}>
            Nos encantaría escuchar de ti. Llena el formulario y nos pondremos en contacto lo antes posible.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.grid}>
            {/* Campo Nombre */}
            <div className={styles.field}>
              <label htmlFor="name" className={styles.label_input}>
                Nombre *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Tu nombre completo"
                required
                disabled={loading}
                className={`${styles.input} ${touched.name && nameError ? styles.inputError : ''}`}
              />
              {touched.name && nameError && (
                <span className={styles.errorMessage}>{nameError}</span>
              )}
            </div>

            {/* Campo Email */}
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label_input}>
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="tu@email.com"
                required
                disabled={loading}
                className={`${styles.input} ${touched.email && emailError ? styles.inputError : ''}`}
              />
              {touched.email && emailError && (
                <span className={styles.errorMessage}>{emailError}</span>
              )}
            </div>

            {/* Campo Teléfono */}
            <div className={styles.field}>
              <label htmlFor="phone" className={styles.label_input}>
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Tu número de teléfono (opcional)"
                disabled={loading}
                className={styles.input}
              />
            </div>

            {/* Campo Mensaje */}
            <div className={styles.field + ' ' + styles.fullwidth}>
              <label htmlFor="message" className={styles.label_input}>
                Mensaje *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Cuéntanos cómo podemos ayudarte..."
                required
                rows={6}
                disabled={loading}
                className={`${styles.textarea} ${touched.message && messageError ? styles.inputError : ''}`}
              />
              {touched.message && messageError && (
                <span className={styles.errorMessage}>{messageError}</span>
              )}
            </div>
          </div>

          {error && (
            <div className={styles.alert + ' ' + styles.error} role="alert">
              <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className={styles.alert + ' ' + styles.success} role="alert">
              <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span>¡Mensaje enviado exitosamente! Nos pondremos en contacto pronto.</span>
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.button}
              disabled={loading || !isFormValid}
            >
              {loading ? 'Enviando...' : 'Enviar Mensaje'}
            </button>
          </div>

          <p className={styles.required}>* Campos obligatorios</p>
        </form>
      </div>
    </section>
  );
}