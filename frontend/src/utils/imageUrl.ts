export type ImageUrlCandidate = string | { url?: unknown } | null | undefined;

export const DEFAULT_IMAGE_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"%3E%3Crect width="640" height="480" fill="%23f3f4f6"/%3E%3Cpath d="M208 320l88-104 72 88 40-48 88 104z" fill="%23d1d5db"/%3E%3Ccircle cx="256" cy="176" r="24" fill="%23d1d5db"/%3E%3C/svg%3E';

export function normalizeImageUrl(value: ImageUrlCandidate): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (value && typeof value === 'object' && 'url' in value) {
    const nested = (value as { url?: unknown }).url;
    if (typeof nested === 'string') {
      const trimmed = nested.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
  }

  return undefined;
}
