import React, { useEffect } from 'react';

interface NotificationProps {
  open: boolean;
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

const icons = {
  success: (
    <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ marginRight: 12 }}><circle cx="12" cy="12" r="10" /><path d="M16 12l-4 4-2-2" /></svg>
  ),
  error: (
    <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ marginRight: 12 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
  )
};

export const Notification: React.FC<NotificationProps> = ({ open, type, message, onClose }) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fadeIn scaleIn microHover"
      style={{
        position: 'fixed',
        bottom: 40,
        right: 40,
        zIndex: 1001,
        background: type === 'success' ? "linear-gradient(90deg,#2ecc40,#27ae60)" : "linear-gradient(90deg,#e74c3c,#c0392b)",
        color: '#fff',
        padding: '18px 36px',
        borderRadius: 12,
        boxShadow: '0 8px 32px #0003',
        fontWeight: 'bold',
        fontSize: '1.15rem',
        display: 'flex',
        alignItems: 'center',
        minWidth: 320,
        maxWidth: 480,
        letterSpacing: '0.02em',
        border: '2px solid #fff2',
        willChange: 'opacity, transform',
        cursor: 'pointer',
      }}
      tabIndex={0}
      role="status"
      aria-live="polite"
      onClick={onClose}
      title="Cerrar notificación"
    >
      {icons[type]}
      <span style={{ flex: 1, textAlign: 'left' }}>{message}</span>
    </div>
  );
};
