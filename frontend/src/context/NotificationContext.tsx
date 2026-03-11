import React, { createContext, useContext } from 'react';
import { Toaster, toast } from 'react-hot-toast';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showNotification = (type: NotificationType, message: string) => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast.error(message, { icon: '⚠️' });
        break;
      case 'info':
      default:
        toast(message, { icon: 'ℹ️' });
        break;
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '10px',
          },
        }}
      />
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
