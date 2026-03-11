import DOMPurify from 'dompurify';

/**
 * Sanitiza una cadena de texto para prevenir ataques XSS.
 * Útil antes de mostrar contenido HTML generado por el usuario.
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/**
 * Sanitiza un string simple eliminando caracteres que puedan inyectar scripts básicos.
 * Útil para campos de texto planos.
 */
export function sanitizeString(str: string): string {
  if (!str) return '';
  return str
    .replace(/[<>]/g, '') // Elimina < y >
    .trim();
}

/**
 * Valida un objeto completo (ej. payload de formulario) sanitizando sus strings.
 */
export function sanitizeObject<T extends object>(obj: T): T {
  const sanitized = { ...obj } as any;
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]);
    }
  }
  return sanitized;
}
