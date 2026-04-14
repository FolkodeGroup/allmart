// src/components/ui/TabsWrapper.tsx
import React, { useState, useCallback } from 'react';
import styles from './TabsWrapper.module.css';

export interface TabDefinition {
    id: string;
    label: string;
    icon?: React.ReactNode;
    hasError?: boolean;
}

interface TabsWrapperProps {
    tabs: TabDefinition[];
    children: React.ReactNode[];
    defaultTab?: string;
    className?: string;
}

export function TabsWrapper({ tabs, children, defaultTab, className }: TabsWrapperProps) {
    const [activeTab, setActiveTab] = useState<string>(defaultTab ?? tabs[0]?.id ?? '');

    const handleTabClick = useCallback((id: string) => {
        setActiveTab(id);
    }, []);

    const activeIndex = tabs.findIndex(t => t.id === activeTab);

    return (
        <div className={`${styles.wrapper} ${className ?? ''}`}>
            <div className={styles.tabBar} role="tablist" aria-label="Secciones del formulario">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`tabpanel-${tab.id}`}
                        id={`tab-${tab.id}`}
                        type="button"
                        className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''} ${tab.hasError ? styles.tabError : ''}`}
                        onClick={() => handleTabClick(tab.id)}
                    >
                        {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
                        <span className={styles.tabLabel}>{tab.label}</span>
                        {tab.hasError && <span className={styles.tabErrorDot} aria-label="Tiene errores" />}
                    </button>
                ))}
            </div>

            <div className={styles.tabContent}>
                {React.Children.map(children, (child, i) => (
                    <div
                        key={tabs[i]?.id}
                        id={`tabpanel-${tabs[i]?.id}`}
                        role="tabpanel"
                        aria-labelledby={`tab-${tabs[i]?.id}`}
                        hidden={i !== activeIndex}
                        className={styles.tabPanel}
                    >
                        {child}
                    </div>
                ))}
            </div>
        </div>
    );
}