import { useEffect, useState } from 'react';

export function useAppLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Espera a que la página y recursos estén listos
    const onReady = () => setLoading(false);
    if (document.readyState === 'complete') {
      setTimeout(onReady, 350); // Pequeño delay para UX
    } else {
      window.addEventListener('load', onReady);
      return () => window.removeEventListener('load', onReady);
    }
  }, []);

  return loading;
}
