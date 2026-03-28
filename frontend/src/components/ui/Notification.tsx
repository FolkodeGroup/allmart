import React, { useEffect } from 'react';
import styles from './Notification.module.css';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationProps {
  message: string;
  onClose: () => void;
  open: boolean;
  type?: NotificationType; // default: 'info'
  duration?: number; // ms, default: 3000
}

const icons = {
  success: (
    <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ marginRight: 12 }}><circle cx="12" cy="12" r="10" /><path d="M16 12l-4 4-2-2" /></svg>
  ),
  error: (
    <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ marginRight: 12 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
  ),
  info: (
    <svg
      width="24"
      height="24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      style={{ marginRight: 12 }}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
};


export const Notification: React.FC<NotificationProps> = ({
  message,
  onClose,
  open,
  type = 'info',
  duration = 3000,
}) => {
  useEffect(() => {
    if (open && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, onClose, duration]);

  if (!open) return null;
  return (
    <div className={`${styles.notification} ${styles[type]}`} role="alert">
      {icons[type] ?? icons.info}
      <span>{message}</span>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">×</button>
    </div>
  );
};
