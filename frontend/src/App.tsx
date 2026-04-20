import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { RootLayout } from './components/layout/RootLayout/RootLayout';
import { HomePage } from './pages/Home/HomePage';
import { ProductListPage } from './pages/ProductList/ProductListPage';
import { ProductDetailPage } from './pages/ProductDetail/ProductDetailPage';
import { CartProvider } from './components/layout/context/CartContext';
import { CartPage } from './pages/Cart/CartPage';
import { ContactPage } from './pages/StaticInfo/ContactPage';
import { FaqPage } from './pages/StaticInfo/FaqPage';
import { HowToBuyPage } from './pages/StaticInfo/HowToBuyPage';
import { PrivacyPage } from './pages/StaticInfo/PrivacyPage';
import { ShippingPage } from './pages/StaticInfo/ShippingPage';
import { TermsPage } from './pages/StaticInfo/TermsPage';
import { WithdrawalPage } from './pages/StaticInfo/WithdrawalPage';
import { AdminLogin } from './pages/AdminLogin/AdminLogin';
import { AdminLayout } from './pages/Admin/AdminLayout';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { AdminUserSettings } from './pages/Admin/AdminUserSettings';
import { AdminRoute } from './components/AdminRoute';
import { LegacyRedirect } from './components/LegacyRedirect';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminLoadingFallback } from './components/ui/AdminLoadingFallback';
import { AdminProvidersWrapper } from './components/AdminProvidersWrapper';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import FullScreenLoader from './components/ui/FullScreenLoader';
import { useAppReady } from './hooks/useAppReady';

// Lazy load admin feature components for better code splitting
const AdminProducts = lazy(() => import('./features/admin/products/AdminProducts').then(m => ({ default: m.AdminProducts })));
const AdminOrders = lazy(() => import('./features/admin/orders/AdminOrders'));
const AdminReports = lazy(() => import('./features/admin/reports/AdminReports').then(m => ({ default: m.AdminReports })));
const AdminCategories = lazy(() => import('./features/admin/categories/AdminCategories').then(m => ({ default: m.AdminCategories })));
const AdminCategoryProducts = lazy(() => import('./features/admin/categories/AdminCategoryProducts').then(m => ({ default: m.AdminCategoryProducts })));
const AdminPromotions = lazy(() => import('./features/admin/promotions').then(m => ({ default: m.AdminPromotions })));
const AdminCollections = lazy(() => import('./features/admin/collections').then(m => ({ default: m.AdminCollections })));
const BannersAdmin = lazy(() => import('./features/admin/banners/BannersAdmin').then(m => ({ default: m.BannersAdmin })));
const LowStockAlerts = lazy(() => import('./features/admin/lowStockAlerts').then(m => ({ default: m.default })));

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'productos', element: <ProductListPage /> },
      { path: 'producto/:slug', element: <ProductDetailPage /> },
      { path: 'carrito', element: <CartPage /> },
      { path: 'como-comprar', element: <HowToBuyPage /> },
      { path: 'envios', element: <ShippingPage /> },
      { path: 'preguntas-frecuentes', element: <FaqPage /> },
      { path: 'contacto', element: <ContactPage /> },
      { path: 'terminos', element: <TermsPage /> },
      { path: 'privacidad', element: <PrivacyPage /> },
      { path: 'arrepentimiento', element: <WithdrawalPage /> },
    ],
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/admin',
    element: <AdminRoute><AdminProvidersWrapper><AdminLayout /></AdminProvidersWrapper></AdminRoute>,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'configuracion', element: <AdminUserSettings /> },
      {
        path: 'productos',
        element: (
          <AdminRoute requiredPermission="products.view">
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminProducts />
            </Suspense>
          </AdminRoute>
        )
      },
      {
        path: 'imagenes',
        element: (
          <AdminRoute requiredPermission="products.edit">
            <LegacyRedirect to="/admin/productos" tab="imagenes" />
          </AdminRoute>
        )
      },
      {
        path: 'variantes',
        element: (
          <AdminRoute requiredPermission="variants.view">
            <LegacyRedirect to="/admin/productos" tab="variantes" />
          </AdminRoute>
        )
      },
      {
        path: 'categorias',
        element: (
          <AdminRoute requiredPermission="categories.view">
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminCategories />
            </Suspense>
          </AdminRoute>
        )
      },
      {
        path: 'categorias/:categoryId',
        element: (
          <AdminRoute requiredPermission="categories.view">
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminCategoryProducts />
            </Suspense>
          </AdminRoute>
        )
      },
      {
        path: 'pedidos',
        element: (
          <AdminRoute requiredPermission="orders.view">
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminOrders />
            </Suspense>
          </AdminRoute>
        )
      },
      {
        path: 'alertas-stock',
        element: (
          <AdminRoute requiredPermission="orders.view">
            <Suspense fallback={<AdminLoadingFallback />}>
              <LowStockAlerts />
            </Suspense>
          </AdminRoute>
        )
      },
      {
        path: 'reportes',
        element: (
          <AdminRoute requiredPermission="reports.view">
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminReports />
            </Suspense>
          </AdminRoute>
        )
      },
      {
        path: 'promociones',
        element: (
          <AdminRoute requiredPermission="products.view">
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminPromotions />
            </Suspense>
          </AdminRoute>
        )
      },
      {
        path: 'colecciones',
        element: (
          <AdminRoute requiredPermission="products.view">
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminCollections />
            </Suspense>
          </AdminRoute>
        )
      },
      {
        path: 'banners',
        element: (
          <AdminRoute requiredPermission="products.view">
            <Suspense fallback={<AdminLoadingFallback />}>
              <BannersAdmin />
            </Suspense>
          </AdminRoute>
        )
      },
    ],
  },
]);

function App() {
  const ready = useAppReady();
  return (
    <>
      {!ready && <FullScreenLoader />}
      {ready && (
        <ErrorBoundary>
          <NotificationProvider>
            <AdminAuthProvider>
              <CartProvider>
                <RouterProvider router={router} />
              </CartProvider>
            </AdminAuthProvider>
          </NotificationProvider>
        </ErrorBoundary>
      )}
    </>
  );
}

export default App
