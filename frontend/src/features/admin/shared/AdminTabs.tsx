import React from 'react';
import styles from './AdminTabs.module.css';

export interface AdminTab {
    key: string;
    label: string;
}

interface AdminTabsProps {
    tabs: AdminTab[];
    active: string;
    onChange: (key: string) => void;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({ tabs, active, onChange }) => (
    <nav className={styles.tabs}>
        {tabs.map(tab => (
            <button
                key={tab.key}
                className={active === tab.key ? `${styles.tab} ${styles.active}` : styles.tab}
                onClick={() => onChange(tab.key)}
                type="button"
            >
                {tab.label}
            </button>
        ))}
    </nav>
);
