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
      { path: 'pedidos', element: <AdminOrders /> },
      { path: 'reportes', element: <AdminReports /> },
    ],
  },
]);

function App() {
  return (
    <AdminAuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AdminAuthProvider>
  );
}

export default App
