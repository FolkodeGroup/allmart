// frontend/src/App.tsx

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { RootLayout } from './components/layout/RootLayout/RootLayout';
import { HomePage } from './pages/Home/HomePage';
import { ProductListPage } from './pages/ProductList/ProductListPage';
import { ProductDetailPage } from './pages/ProductDetail/ProductDetailPage';
import { CartProvider } from './components/layout/context/CartContext';
import { FavoritesProvider } from './components/layout/context/FavoritesContext';
import { CartPage } from './pages/Cart/CartPage';
import { FavoritesPage } from './pages/Favorites/FavoritesPage';
import { AdminRoute } from './components/AdminRoute';
import { LegacyRedirect } from './components/LegacyRedirect';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminLoadingFallback } from './components/ui/AdminLoadingFallback';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import FullScreenLoader from './components/ui/FullScreenLoader';
import { useAppReady } from './hooks/useAppReady';

// 🟢 OPTIMIZACIÓN: Lazy loading de las vistas estáticas del cliente público para reducir el bundle base
const ContactPage = lazy(() => import('./pages/StaticInfo/ContactPage').then(m => ({ default: m.ContactPage })));
const FaqPage = lazy(() => import('./pages/StaticInfo/FaqPage').then(m => ({ default: m.FaqPage })));
const HowToBuyPage = lazy(() => import('./pages/StaticInfo/HowToBuyPage').then(m => ({ default: m.HowToBuyPage })));
const PrivacyPage = lazy(() => import('./pages/StaticInfo/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const ShippingPage = lazy(() => import('./pages/StaticInfo/ShippingPage').then(m => ({ default: m.ShippingPage })));
const TermsPage = lazy(() => import('./pages/StaticInfo/TermsPage').then(m => ({ default: m.TermsPage })));
const WithdrawalPage = lazy(() => import('./pages/StaticInfo/WithdrawalPage').then(m => ({ default: m.WithdrawalPage })));

// 🟢 OPTIMIZACIÓN: Lazy loading de vistas administrativas clave para aislar dependencias de gráficos y layouts
const AdminLogin = lazy(() => import('./pages/AdminLogin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUserSettings = lazy(() => import('./pages/Admin/AdminUserSettings').then(m => ({ default: m.AdminUserSettings })));

// 🟢 OPTIMIZACIÓN EXTREMA: Lazy loading del wrapper de contextos administrativos para evitar fugar dependencias al bundle público de la Home
const AdminProvidersWrapper = lazy(() => import('./components/AdminProvidersWrapper').then(m => ({ default: m.AdminProvidersWrapper })));

// Lazy load admin feature components for better code splitting
const AdminProducts = lazy(() => import('./features/admin/products/AdminProducts').then(m => ({ default: m.AdminProducts })));
const AdminOrders = lazy(() => import('./features/admin/orders/AdminOrders'));
const OrderDetailPage = lazy(() => import('./features/admin/orders/pages/OrderDetailPage'));
const AdminReports = lazy(() => import('./features/admin/reports/AdminReports').then(m => ({ default: m.AdminReports })));
const SuppliersAdmin = lazy(() => import('./features/admin/suppliers/SuppliersAdmin').then(m => ({ default: m.SuppliersAdmin })));
const SuppliersAdminFormWrapper = lazy(() => import('./features/admin/suppliers/SuppliersAdminFormWrapper').then(m => ({ default: m.SuppliersAdminFormWrapper })));
const AdminCategories = lazy(() => import('./features/admin/categories/AdminCategories').then(m => ({ default: m.AdminCategories })));
const AdminCategoryFormPageWrapper = lazy(() => import('./features/admin/categories/AdminCategoryFormPageWrapper').then(m => ({ default: m.AdminCategoryFormPageWrapper })));
const AdminCategoryProducts = lazy(() => import('./features/admin/categories/AdminCategoryProducts').then(m => ({ default: m.AdminCategoryProducts })));
const AdminPromotions = lazy(() => import('./features/admin/promotions').then(m => ({ default: m.AdminPromotions })));
const AdminCollections = lazy(() => import('./features/admin/collections').then(m => ({ default: m.AdminCollections })));
const BannersAdmin = lazy(() => import('./features/admin/banners/BannersAdmin').then(m => ({ default: m.BannersAdmin })));
const StockAlertsPage = lazy(() => import('./features/admin/lowStockAlerts').then(m => ({ default: m.StockAlertsPage })));
const OutOfStockAlertsPage = lazy(() => import('./features/admin/outOfStockAlerts').then(m => ({ default: m.OutOfStockAlertsPage })));
const AdminContacts = lazy(() => import('./features/admin/contacts').then(m => ({ default: m.AdminContacts })));

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
      { path: 'favoritos', element: <FavoritesPage /> },
      {
        path: 'como-comprar',
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <HowToBuyPage />
          </Suspense>
        )
      },
      {
        path: 'envios',
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <ShippingPage />
          </Suspense>
        )
      },
      {
        path: 'preguntas-frecuentes',
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <FaqPage />
          </Suspense>
        )
      },
      {
        path: 'contacto',
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <ContactPage />
          </Suspense>
        )
      },
      {
        path: 'terminos',
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <TermsPage />
          </Suspense>
        )
      },
      {
        path: 'privacidad',
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <PrivacyPage />
          </Suspense>
        )
      },
      {
        path: 'arrepentimiento',
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <WithdrawalPage />
          </Suspense>
        )
      },
    ],
  },
  {
    path: '/admin/login',
    element: (
      <Suspense fallback={<FullScreenLoader />}>
        <AdminLogin />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <Suspense fallback={<FullScreenLoader />}>
          <AdminProvidersWrapper>
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminLayout />
            </Suspense>
          </AdminProvidersWrapper>
        </Suspense>
      </AdminRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<AdminLoadingFallback />}>
            <AdminDashboard />
          </Suspense>
        )
      },
      {
        path: 'configuracion',
        element: (
          <Suspense fallback={<AdminLoadingFallback />}>
            <AdminUserSettings />
          </Suspense>
        )
      },
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
        path: 'categorias/nueva',
        element: (
          <AdminRoute requiredPermission="categories.edit">
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminCategoryFormPageWrapper />
            </Suspense>
          </AdminRoute>
        )
      },
      {
        path: 'categorias/:categoryId/editar',
        element: (
          <AdminRoute requiredPermission="categories.edit">
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminCategoryFormPageWrapper />
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
        path: 'pedidos/:id',
        element: (
          <AdminRoute requiredPermission="orders.view">
            <Suspense fallback={<AdminLoadingFallback />}>
              <OrderDetailPage />
            </Suspense>
          </AdminRoute>
        )
      },
      {
        path: 'alertas-stock',
        element: (
          <AdminRoute requiredPermission="orders.view">
            <Suspense fallback={<AdminLoadingFallback />}>
              <StockAlertsPage />
            </Suspense>
          </AdminRoute>
        )
      },
      {
        path: 'alertas-sin-stock',
        element: (
          <AdminRoute requiredPermission="orders.view">
            <Suspense fallback={<AdminLoadingFallback />}>
              <OutOfStockAlertsPage />
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
        path: 'proveedores',
        element: (
          <AdminRoute requiredPermission="suppliers.view">
            <Suspense fallback={<AdminLoadingFallback />}>
              <SuppliersAdmin />
            </Suspense>
          </AdminRoute>
        )
      }, {
        path: 'proveedores/nuevo',
        element: (
          <AdminRoute requiredPermission="suppliers.view">
            <Suspense fallback={<AdminLoadingFallback />}>
              <SuppliersAdminFormWrapper />
            </Suspense>
          </AdminRoute>
        ),
      },
      {
        path: 'proveedores/:id/editar',
        element: (
          <AdminRoute requiredPermission="suppliers.view">
            <Suspense fallback={<AdminLoadingFallback />}>
              <SuppliersAdminFormWrapper />
            </Suspense>
          </AdminRoute>
        ),
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
      {
        path: 'contactos',
        element: (
          <AdminRoute requiredPermission="orders.view">
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminContacts />
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
                <FavoritesProvider>
                  <RouterProvider router={router} />
                </FavoritesProvider>
              </CartProvider>
            </AdminAuthProvider>
          </NotificationProvider>
        </ErrorBoundary>
      )}
    </>
  );
}

export default App;