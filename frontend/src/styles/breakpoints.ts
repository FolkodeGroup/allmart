/**
 * Breakpoints del sistema de diseño AllMart.
 * Referencia: mobile-first (usar min-width en media queries CSS).
 *
 * En CSS modules usar:
 *   @media (min-width: 640px)  { ... }  // sm (tablet pequeña)
 *   @media (min-width: 768px)  { ... }  // md (tablet)
 *   @media (min-width: 1024px) { ... }  // lg (desktop)
 *   @media (min-width: 1280px) { ... }  // xl (desktop grande)
 *   @media (min-width: 1536px) { ... }  // 2xl (wide)
 */
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/** Helper para crear media query strings en JS/TS si es necesario */
export function mediaQuery(bp: Breakpoint, type: 'min' | 'max' = 'min'): string {
  const value = type === 'max' ? breakpoints[bp] - 1 : breakpoints[bp];
  return `(${type}-width: ${value}px)`;
}
