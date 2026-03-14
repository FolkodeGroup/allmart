import React from 'react';
import { AdminThemeProvider } from './AdminThemeProvider';
import { ThemeSwitch } from './ThemeSwitch';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AdminThemeProvider>
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <header className="flex justify-end p-4">
        <ThemeSwitch />
      </header>
      <main>{children}</main>
    </div>
  </AdminThemeProvider>
);
