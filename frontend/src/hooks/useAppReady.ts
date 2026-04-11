import { useEffect, useState } from 'react';
import { publicCollectionsService } from '../services/publicCollectionsService';
import { publicBannersService } from '../services/publicBannersService';

export function useAppReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function waitForEverything() {
      // Esperar a que window.load termine
      await new Promise<void>((resolve) => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', () => resolve(), { once: true });
        }
      });
      // Esperar datos críticos de HomePage
      try {
        await Promise.all([
          publicCollectionsService.getHomeCollections(),
          publicBannersService.getActiveBanners(),
        ]);
      } catch (e) {
        // Si falla, igual continuar para no bloquear la app
      }
      if (isMounted) setReady(true);
    }
    waitForEverything();
    return () => { isMounted = false; };
  }, []);

  return ready;
}
