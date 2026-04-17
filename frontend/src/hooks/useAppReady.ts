import { useEffect, useState } from 'react';
import { publicCollectionsService } from '../services/publicCollectionsService';
import { publicBannersService } from '../services/publicBannersService';
import { fetchPublicCategories } from '../services/categoriesService';

const MAX_WAIT_MS = 3000;

export function useAppReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const timeout = setTimeout(() => {
      if (isMounted) setReady(true);
    }, MAX_WAIT_MS);

    async function waitForEverything() {
      try {
        // Pre-carga los datos que necesitan los componentes del home.
        // Gracias al caché de módulo en cada servicio, cuando los componentes
        // llamen a estas funciones obtendrán el resultado instantáneamente.
        await Promise.all([
          publicCollectionsService.getHomeCollections(),
          publicBannersService.getActiveBanners(),
          fetchPublicCategories(),
        ]);
      } catch {
        // Si falla, continuar para no bloquear la app
      }
      if (isMounted) {
        clearTimeout(timeout);
        setReady(true);
      }
    }

    waitForEverything();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  return ready;
}
