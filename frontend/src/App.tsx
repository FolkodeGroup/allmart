import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { RootLayout } from './components/layout/RootLayout/RootLayout';
import { HomePage } from './pages/Home/HomePage';
import { ProductListPage } from './pages/ProductList/ProductListPage';
import { ProductDetailPage } from './pages/ProductDetail/ProductDetailPage';
import { CartProvider } from './components/layout/context/CartContext';
import { CartPage } from './pages/Cart/CartPage';
import { AdminLogin } from './pages/AdminLogin/AdminLogin';
import { AdminLayout } from './pages/Admin/AdminLayout';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { AdminRoute } from './components/AdminRoute';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminLoadingFallback } from './components/ui/AdminLoadingFallback';
import { AdminProvidersWrapper } from './components/AdminProvidersWrapper';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';

// Lazy load admin feature components for better code splitting
const AdminProducts = lazy(() => import('./features/admin/products/AdminProducts').then(m => ({ default: m.AdminProducts })));
const AdminOrders = lazy(() => import('./features/admin/orders/AdminOrders'));
const AdminReports = lazy(() => import('./features/admin/reports/AdminReports').then(m => ({ default: m.AdminReports })));
const AdminCategories = lazy(() => import('./features/admin/categories/AdminCategories').then(m => ({ default: m.AdminCategories })));
const AdminCategoryProducts = lazy(() => import('./features/admin/categories/AdminCategoryProducts').then(m => ({ default: m.AdminCategoryProducts })));
const AdminVariants = lazy(() => import('./features/admin/variants/AdminVariants').then(m => ({ default: m.AdminVariants })));
const AdminImages = lazy(() => import('./features/admin/images/AdminImages').then(m => ({ default: m.AdminImages })));
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
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminImages />
            </Suspense>
          </AdminRoute>
        ) 
      },
      { 
        path: 'variantes', 
        element: (
          <AdminRoute requiredPermission="variants.view">
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminVariants />
            </Suspense>
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
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AdminAuthProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </AdminAuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App
