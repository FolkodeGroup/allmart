import { createContext } from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);