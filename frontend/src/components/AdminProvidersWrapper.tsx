/**
 * AdminProvidersWrapper
 * 
 * Wraps admin pages with all necessary providers.
 * This component is lazy-loaded only when accessed, improving initial bundle size.
 */

import React from 'react';
import { AdminCategoriesProvider } from '../context/AdminCategoriesContext';
import { AdminProductsProvider } from '../context/AdminProductsContext';
import { AdminVariantsProvider } from '../context/AdminVariantsContext';
import { AdminImagesProvider } from '../context/AdminImagesContext';
import { AdminOrdersProvider } from '../context/AdminOrdersContext';
import { DashboardLayoutProvider } from '../context/DashboardLayoutContext';

interface Props {
  children: React.ReactNode;
}

/**
 * Provides all admin-specific contexts.
 * These providers are only loaded when user navigates to admin routes.
 */
export const AdminProvidersWrapper: React.FC<Props> = ({ children }) => {
  return (
    <DashboardLayoutProvider>
      <AdminCategoriesProvider>
        <AdminProductsProvider>
          <AdminVariantsProvider>
            <AdminImagesProvider>
              <AdminOrdersProvider>
                {children}
              </AdminOrdersProvider>
            </AdminImagesProvider>
          </AdminVariantsProvider>
        </AdminProductsProvider>
      </AdminCategoriesProvider>
    </DashboardLayoutProvider>
  );
};
