import React from 'react';
import styles from './MobileDashboardTabs.module.css';

export type DashboardMobileTab = 'resumen' | 'pedidos' | 'alertas' | 'analitica';

interface MobileDashboardTabsProps {
  activeTab: DashboardMobileTab;
  onTabChange: (tab: DashboardMobileTab) => void;
  pendingOrdersCount?: number;
  lowStockCount?: number;
}

export const MobileDashboardTabs: React.FC<MobileDashboardTabsProps> = ({
  activeTab,
  onTabChange,
  pendingOrdersCount = 0,
  lowStockCount = 0,
}) => {
  const tabs: { id: DashboardMobileTab; label: string; icon: string; badge?: number }[] = [
    { id: 'resumen', label: 'Resumen', icon: 'bi-grid-1x2' },
    { id: 'pedidos', label: 'Pedidos', icon: 'bi-cart-check', badge: pendingOrdersCount },
    { id: 'alertas', label: 'Alertas', icon: 'bi-exclamation-triangle', badge: lowStockCount },
    { id: 'analitica', label: 'Analítica', icon: 'bi-bar-chart-line' },
  ];

  return (
    <nav className={styles.tabsNav} aria-label="Pestañas del Dashboard Móvil">
      <div className={styles.tabsList} role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              className={`${styles.tabBtn} ${isActive ? styles.tabActive : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <i className={`bi ${tab.icon} ${styles.tabIcon}`} aria-hidden="true" />
              <span className={styles.tabLabel}>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={styles.tabBadge}>{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};