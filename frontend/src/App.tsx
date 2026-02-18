import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RootLayout } from './components/layout/RootLayout/RootLayout';
import { HomePage } from './pages/Home/HomePage';
import { ProductListPage } from './pages/ProductList/ProductListPage';
import { ProductDetailPage } from './pages/ProductDetail/ProductDetailPage';
import { CartProvider } from './components/layout/context/CartContext';
import { CartPage } from './pages/Cart/CartPage';

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
]);

function App() {
  return (
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  );
}

export default App
