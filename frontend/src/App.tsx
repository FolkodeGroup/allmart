import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RootLayout } from './components/layout/RootLayout/RootLayout';
import { HomePage } from './pages/Home/HomePage';
import { ProductListPage } from './pages/ProductList/ProductListPage';
import { ProductDetailPage } from './pages/ProductDetail/ProductDetailPage';
import { CartProvider } from './components/layout/context/CartContext';
import { CartPage } from './pages/Cart/CartPage';
import { AdminLogin } from './pages/AdminLogin/AdminLogin';
import { AdminLayout } from './pages/Admin/AdminLayout';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { AdminProducts } from './pages/Admin/sections/AdminProducts';
import { AdminOrders } from './pages/Admin/sections/AdminOrders';
import { AdminReports } from './pages/Admin/sections/AdminReports';
import { AdminRoute } from './components/AdminRoute';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { AdminProductsProvider } from './context/AdminProductsContext';
import { AdminCategoriesProvider } from './context/AdminCategoriesContext';
import { AdminOrdersProvider } from './context/AdminOrdersContext';
import { AdminVariantsProvider } from './context/AdminVariantsContext';
import { AdminImagesProvider } from './context/AdminImagesContext';
import { AdminCategories } from './pages/Admin/sections/AdminCategories';
import { AdminVariants } from './pages/Admin/sections/AdminVariants';
import { AdminImages } from './pages/Admin/sections/AdminImages';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
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
  },
  {
    path: '/admin',
    element: <AdminRoute><AdminLayout /></AdminRoute>,
    children: [
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'productos', element: <AdminProducts /> },
      { path: 'imagenes', element: <AdminImages /> },
      { path: 'variantes', element: <AdminVariants /> },
      { path: 'categorias', element: <AdminCategories /> },
      { path: 'pedidos', element: <AdminOrders /> },
      { path: 'reportes', element: <AdminRoute requiredPermission="reports.view"><AdminReports /></AdminRoute> },
    ],
  },
]);

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AdminAuthProvider>
          <AdminCategoriesProvider>
            <AdminProductsProvider>
              <AdminVariantsProvider>
                <AdminImagesProvider>
                  <AdminOrdersProvider>
                    <CartProvider>
                      <RouterProvider router={router} />
                    </CartProvider>
                  </AdminOrdersProvider>
                </AdminImagesProvider>
              </AdminVariantsProvider>
            </AdminProductsProvider>
          </AdminCategoriesProvider>
        </AdminAuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App
