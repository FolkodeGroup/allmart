import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface LegacyRedirectProps {
  to: string;
  tab?: string;
}

/**
 * Componente para manejar redirects de rutas legacy
 * Redirige de URL antiguas a nuevas rutas con query parameters
 */
export function LegacyRedirect({ to, tab }: LegacyRedirectProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const targetUrl = tab ? `${to}?tab=${tab}` : to;
    navigate(targetUrl, { replace: true });
  }, [navigate, to, tab]);

  return null;
}
