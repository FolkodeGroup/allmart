import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useAdminTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('admin-theme');
    return stored === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('admin-theme', theme);
    
    // Aplicamos los estilos según el tema activo en el panel administrador
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      document.body.setAttribute('data-admin-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      document.body.setAttribute('data-admin-theme', 'light');
    }

    // Limpieza estricta: al desmontar el layout de administración (salida al sitio público),
    // removemos cualquier clase o propiedad oscura global del navegador.
    return () => {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      document.body.removeAttribute('data-admin-theme');
    };
  }, [theme]);

  return { theme, setTheme };
}