import React from 'react';
import { ThemeProvider } from './ThemeContext';

export const AdminThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);
