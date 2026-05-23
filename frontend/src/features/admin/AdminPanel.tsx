import React, { useState } from 'react';
import { AdminLayout } from './shared/AdminLayout';
import { AdminProducts } from './products';
import { AdminCategories } from './categories';
import { AdminVariants } from './variants';
import { AdminImages } from './images';
import { AdminOrders } from './orders';
import { AdminReports } from './reports';
import { SuppliersAdmin } from './suppliers';
import { AdminTabs } from './shared/AdminTabs';
import type { AdminTab } from './shared/AdminTabs';

const TABS: AdminTab[] = [
  { key: 'products', label: 'Productos' },
  { key: 'categories', label: 'Categorías' },
  { key: 'variants', label: 'Variantes' },
  { key: 'images', label: 'Imágenes' },
  { key: 'orders', label: 'Órdenes' },
  { key: 'reports', label: 'Reportes' },
  { key: 'suppliers', label: 'Proveedores' },
];

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('products');
  return (
    <AdminLayout>
      <AdminTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      {activeTab === 'products' && <AdminProducts />}
      {activeTab === 'categories' && <AdminCategories />}
      {activeTab === 'variants' && <AdminVariants />}
      {activeTab === 'images' && <AdminImages />}
      {activeTab === 'orders' && <AdminOrders />}
      {activeTab === 'reports' && <AdminReports />}
      {activeTab === 'suppliers' && <SuppliersAdmin />}
    </AdminLayout>
  );
};
