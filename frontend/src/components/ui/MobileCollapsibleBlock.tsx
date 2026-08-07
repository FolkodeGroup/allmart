import React, { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './MobileCollapsibleBlock.module.css';

interface MobileCollapsibleBlockProps {
  title: string;
  icon?: ReactNode;
  defaultExpanded?: boolean;
  badge?: string | number;
  children: ReactNode;
  className?: string;
}

export const MobileCollapsibleBlock: React.FC<MobileCollapsibleBlockProps> = ({
  title,
  icon,
  defaultExpanded = true,
  badge,
  children,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`${styles.block} ${isExpanded ? styles.expanded : ''} ${className}`}>
      <button
        type="button"
        className={styles.headerBtn}
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        <div className={styles.headerLeft}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <h3 className={styles.title}>{title}</h3>
          {badge !== undefined && badge !== '' && (
            <span className={styles.badge}>{badge}</span>
          )}
        </div>
        <span className={styles.chevron}>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {isExpanded && <div className={styles.content}>{children}</div>}
    </div>
  );
};