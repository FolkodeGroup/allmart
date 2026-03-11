import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (type: NotificationType, message: string) => void;
  hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const hideNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback((type: NotificationType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => hideNotification(id), 5000);
  }, [hideNotification]);

  const value = useMemo(() => ({
    notifications,
    showNotification,
    hideNotification
  }), [notifications, showNotification, hideNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer notifications={notifications} onHide={hideNotification} />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de un NotificationProvider');
  }
  return context;
};

// --- Componente ToastContainer --- (puedes moverlo a un archivo separado si prefieres)
const ToastContainer: React.FC<{ notifications: Notification[], onHide: (id: string) => void }> = ({ notifications, onHide }) => {
  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxWidth: '400px'
    }}>
      {notifications.map((n) => (
        <Toast key={n.id} notification={n} onHide={() => onHide(n.id)} />
      ))}
    </div>
  );
};

const Toast: React.FC<{ notification: Notification, onHide: () => void }> = ({ notification, onHide }) => {
  const colors = {
    info: '#2196f3',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336'
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      color: '#333',
      padding: '1rem',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      borderLeft: `5px solid ${colors[notification.type]}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{notification.message}</span>
      <button 
        onClick={onHide}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.2rem',
          color: '#999',
          fontSize: '1.2rem',
          marginLeft: '1rem'
        }}
      >
        ×
      </button>
    </div>
  );
};
