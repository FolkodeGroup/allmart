// Barrel — Contextos globales y de administración
export { useAdminAuth, AdminAuthProvider } from './AdminAuthContext';
export { AdminProductsProvider } from './AdminProductsContext';
export { useAdminProducts } from './useAdminProductsContext';
export { AdminCategoriesProvider, useAdminCategories } from './AdminCategoriesContext';
export { AdminVariantsProvider } from './AdminVariantsProvider';
export { useAdminVariants } from '../hooks/useAdminVariants';
export { AdminImagesProvider, useAdminImages } from './AdminImagesContext';
export { AdminOrdersProvider, useAdminOrders } from './AdminOrdersContext';
export { NotificationProvider } from './NotificationContext';
export { NotificationContext } from './NotificationContextValue';
export { useNotification } from '../hooks/useNotification';
