import { Outlet, ScrollRestoration } from 'react-router-dom';
import { SidebarProvider } from '../context/LayoutContext'; // Tu motor de estado
import { Sidebar } from '../context/Sidebar'; // Tu componente visual verde
import { Header } from '../Header/Header';
import { Footer } from '../Footer/Footer';

export function RootLayout() {
  return (
    <SidebarProvider>
      <ScrollRestoration />
      <div className='flex h-screen w-full bg-gray-50 overflow-hidden'>
        <Sidebar />
        <div className='flex-1 flex flex-col min-w-0 h-full overflow-y-auto'>
          <Header />
          <main className='flex-1'>
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}
