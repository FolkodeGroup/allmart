import { useEffect } from 'react';
import { publicCollectionsService } from '../services/publicCollectionsService';
import { publicBannersService } from '../services/publicBannersService';
import { fetchPublicCategories } from '../services/categoriesService';

export function useAppReady() {
  useEffect(() => {
    // Pre-carga los datos en background sin bloquear el renderizado.
    // Gracias al caché de módulo en cada servicio, cuando los componentes
    // llamen a estas funciones obtendrán el resultado instantáneamente.
    Promise.all([
      publicCollectionsService.getHomeCollections(),
      publicBannersService.getActiveBanners(),
      fetchPublicCategories(),
    ]).catch(() => {
      // Si falla, los componentes manejan su propio estado de carga
    });
  }, []);

  // Siempre listo: la app renderiza inmediatamente sin esperar la red
  return true;
}
