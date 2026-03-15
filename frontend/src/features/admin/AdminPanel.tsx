import React from 'react';
import { AdminLayout } from './shared/AdminLayout';
import { AdminProducts } from './products';
import { AdminCategories } from './categories';
import { AdminVariants } from './variants';
import { AdminImages } from './images';
import { AdminOrders } from './orders';
import { AdminReports } from './reports';

export const AdminPanel: React.FC = () => (
  <AdminLayout>
    {/* Aquí puedes agregar lógica de rutas o tabs si es necesario */}
    <AdminProducts />
    <AdminCategories />
    <AdminVariants />
    <AdminImages />
    <AdminOrders />
    <AdminReports />
  </AdminLayout>
);
