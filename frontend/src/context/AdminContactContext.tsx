// src/context/AdminContactsContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { contactsService } from '../services/contactsService';

interface AdminContactsContextValue {
    getUnreadContactsCount: () => number;
    refreshUnreadCount: () => Promise<void>;
}

const AdminContactContext = createContext<AdminContactsContextValue | null>(null);

const POLL_INTERVAL_MS = 60_000; // refresca cada 60 segundos

export function AdminContactProvider({ children }: { children: React.ReactNode }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const refreshUnreadCount = useCallback(async () => {
        try {
            const result = await contactsService.listContacts(1, 1, 'unread');
            const total = result.pagination.total as number;
            setUnreadCount(total);
        } catch {
            // silencioso: no romper el layout por un conteo fallido
        }
    }, []);

    useEffect(() => {
        refreshUnreadCount();
        intervalRef.current = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [refreshUnreadCount]);

    const getUnreadContactsCount = useCallback(() => unreadCount, [unreadCount]);

    return (
        <AdminContactContext.Provider value={{ getUnreadContactsCount, refreshUnreadCount }}>
            {children}
        </AdminContactContext.Provider>
    );
}

export function useAdminContact() {
    const ctx = useContext(AdminContactContext);
    if (!ctx) throw new Error('useAdminContact must be used within AdminContactProvider');
    return ctx;
}