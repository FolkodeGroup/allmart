import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useAdminTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('admin-theme');
    return stored === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('admin-theme', theme);
    // Los modales se renderizan por portal en document.body, por eso el tema
    // del admin también se refleja en body para que los confirm/warning tomen
    // los colores correctos en modo claro y oscuro.
    document.body.setAttribute('data-admin-theme', theme);

    return () => {
      document.body.removeAttribute('data-admin-theme');
    };
  }, [theme]);

  return { theme, setTheme };
}
