import React from 'react';
import styles from './Badge.module.css';
import { Tag } from 'lucide-react';

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className = '' }) => (
  <span
    className={`${styles.badge} ${styles.category} rounded-full px-2 py-1 text-xs font-semibold flex items-center gap-1 bg-green-100 text-green-700 border border-green-300 ${className}`}
    title="Categoría"
  >
    <Tag size={14} className="inline-block mr-1 text-green-500" />
    {category}
  </span>
);
