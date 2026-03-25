import React from 'react';
import styles from './Spinner.module.css';

export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
    <span
        className={`${styles.spinner} ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
    />
);
