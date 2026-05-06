import React from 'react';
import { PackageOpen } from 'lucide-react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <PackageOpen size={48} color="#94a3b8" />,
  title,
  description,
  action
}) => {
  return (
    <div
      className={styles.emptyState}
      aria-live="polite"
      role="status"
    >
      <div style={{ marginBottom: '1.5rem' }} aria-hidden="true">
        {icon}
      </div>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'var(--color-text-primary)',
        marginBottom: '0.5rem'
      }}>
        {title}
      </h3>
        <p
          style={{
            color: '#64748b',
            maxWidth: '95vw',
            marginBottom: '1.5rem',
            lineHeight: 1.5,
            fontSize: '1.05rem',
            wordBreak: 'break-word',
          }}
          aria-live="polite"
        >
          {description}
        </p>
      {action && (
          <button
            onClick={action.onClick}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: 'var(--color-primary, #2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1.08rem',
              width: '100%',
              maxWidth: 340,
              minHeight: 44,
              margin: '0 auto',
            }}
            aria-label={action.label}
          >
            {action.label}
          </button>
      )}
    </div>
  );
};
