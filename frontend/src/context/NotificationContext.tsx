import React, { useCallback, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { NotificationContext, type NotificationType } from './NotificationContextValue';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showNotification = useCallback((type: NotificationType, message: string) => {
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
  }, []);

  const value = useMemo(() => ({ showNotification }), [showNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right" /* 🟢 FIX: Arriba a la derecha para no obstruir interacciones */
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        }}
      />
    </NotificationContext.Provider>
  );
};