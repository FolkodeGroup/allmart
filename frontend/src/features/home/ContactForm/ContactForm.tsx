import { useState } from 'react';
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

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar errores cuando el usuario empieza a escribir
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await contactsService.submitContact({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        message: formData.message,
      });

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', message: '' });

      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: Error | unknown) {
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

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.grid}>
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
                placeholder="Tu nombre completo"
                required
                minLength={2}
                disabled={loading}
                className={styles.input}
              />
            </div>

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
                placeholder="tu@email.com"
                required
                disabled={loading}
                className={styles.input}
              />
            </div>

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

            <div className={styles.field + ' ' + styles.fullwidth}>
              <label htmlFor="message" className={styles.label_input}>
                Mensaje *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Cuéntanos cómo podemos ayudarte..."
                required
                minLength={10}
                rows={6}
                disabled={loading}
                className={styles.textarea}
              />
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
              disabled={loading}
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
