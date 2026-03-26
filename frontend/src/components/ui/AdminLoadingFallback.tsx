import React from 'react';
import styles from './AdminLoadingFallback.module.css';

/**
 * Fallback component shown while admin pages load via lazy loading.
 * Displays an optimized skeleton/loading state.
 */
export const AdminLoadingFallback: React.FC = () => (
  <div className={styles.fallbackContainer}>
    <div className={styles.contentWrapper}>
      {/* Header skeleton */}
      <div className={styles.skeleton} style={{ height: '40px', marginBottom: '20px', borderRadius: '8px' }} />
      
      {/* Content area with three column skeleton */}
      <div className={styles.gridSkeleton}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeleton} style={{ height: '200px', marginBottom: '12px' }} />
            <div className={styles.skeleton} style={{ height: '16px', marginBottom: '8px' }} />
            <div className={styles.skeleton} style={{ height: '16px', width: '80%' }} />
          </div>
        ))}
      </div>
    </div>
  </div>
);
