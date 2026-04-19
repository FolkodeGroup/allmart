import { useState, useRef, useEffect } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { Button } from '../../ui/Button/Button';
import styles from './UserProfileCard.module.css';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  editor: 'Editor',
};

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  admin: {
    bg: 'rgba(118, 146, 130, 0.15)',
    text: '#7d9682',
    border: 'rgba(118, 146, 130, 0.3)',
  },
  editor: {
    bg: 'rgba(221, 176, 140, 0.15)',
    text: '#ddb08c',
    border: 'rgba(221, 176, 140, 0.3)',
  },
};

interface UserProfileCardProps {
  isCollapsed?: boolean;
}

export function UserProfileCard({ isCollapsed = false }: UserProfileCardProps) {
  const { user, role, logout } = useAdminAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    window.location.replace('/');
  };

  const handleDropdownToggle = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const getRoleStyle = (userRole?: string) => {
    return ROLE_COLORS[userRole || 'editor'] || ROLE_COLORS.editor;
  };

  const userInitials = user
    ?.split('@')[0]
    .split('.')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className={`${styles.container} ${isCollapsed ? styles.collapsed : ''}`} ref={dropdownRef}>
      <Button
        className={styles.profileButton}
        onClick={handleDropdownToggle}
        aria-label="Abrir menú de perfil"
        aria-expanded={isDropdownOpen}
        variant="ghost"
        type="button"
      >
        <div className={styles.avatar}>
          <span className={styles.initials}>{userInitials}</span>
        </div>
        {!isCollapsed && (
          <>
            <div className={styles.userInfo}>
              <span className={styles.userEmail}>{user}</span>
              {role && (
                <span
                  className={styles.roleBadge}
                  style={{
                    backgroundColor: getRoleStyle(role).bg,
                    color: getRoleStyle(role).text,
                    borderColor: getRoleStyle(role).border,
                  }}
                >
                  {ROLE_LABELS[role] ?? role}
                </span>
              )}
            </div>
            <div className={`${styles.chevron} ${isDropdownOpen ? styles.chevronOpen : ''}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </>
        )}
      </Button>

      {isDropdownOpen && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownHeader}>
            <div className={styles.dropdownAvatar}>
              <span className={styles.dropdownInitials}>{userInitials}</span>
            </div>
            <div className={styles.dropdownUserInfo}>
              <p className={styles.dropdownUserEmail}>{user}</p>
              {role && (
                <p
                  className={styles.dropdownRoleBadge}
                  style={{
                    backgroundColor: getRoleStyle(role).bg,
                    color: getRoleStyle(role).text,
                  }}
                >
                  {ROLE_LABELS[role] ?? role}
                </p>
              )}
            </div>
          </div>

          <div className={styles.divider} />

          <button className={styles.dropdownItem} type="button" role="menuitem">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
            <span>Configuración</span>
          </button>

          <button
            className={`${styles.dropdownItem} ${styles.logoutItem}`}
            onClick={handleLogout}
            type="button"
            role="menuitem"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}
