import { useContext } from 'react';
import { AdminVariantsContext } from '../context/AdminVariantsContext';

export function useAdminVariants() {
  const ctx = useContext(AdminVariantsContext);
  if (!ctx) throw new Error('useAdminVariants debe usarse dentro de AdminVariantsProvider');
  return ctx;
}