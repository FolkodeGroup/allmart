export function resolveImageUrl(value?: string | null): string | undefined {
  if (!value || typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^\/\//.test(trimmed)) {
    return `${window.location.protocol}${trimmed}`;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  const baseUrl = import.meta.env.BASE_URL ?? '/';
  const sanitizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const sanitizedPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;

  return `${sanitizedBase}/${sanitizedPath}`;
}
