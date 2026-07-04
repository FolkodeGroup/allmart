import { useState, useEffect, useCallback } from 'react';
import { getAdminActivityLogs, type AdminActivityLog } from '../services/adminActivityLogService';

interface UseActivityFeedOptions {
    pollInterval?: number;
    maxEvents?: number;
    autoFetch?: boolean;
}

export function useActivityFeed({
    pollInterval = 10000,
    maxEvents = 20,
    autoFetch = true,
}: UseActivityFeedOptions = {}) {
    const [logs, setLogs] = useState<AdminActivityLog[]>([]);
    const [pending, setPending] = useState<AdminActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const fresh = await getAdminActivityLogs();
            setLogs(fresh.slice(0, maxEvents));
        } catch (error) {
            console.error('Error loading activity logs:', error);
        } finally {
            setIsLoading(false);
        }
    }, [maxEvents]);

    // Initial load
    useEffect(() => {
        if (autoFetch) {
            loadLogs();
        }
    }, [autoFetch, loadLogs]);

    // Polling para detectar nuevos eventos con llamadas asíncronas
    useEffect(() => {
        if (!autoFetch) return;

        const interval = setInterval(async () => {
            try {
                const fresh = await getAdminActivityLogs();
                const latestKnown = logs[0]?.timestamp;

                if (latestKnown) {
                    const newItems = fresh.filter(
                        (l: AdminActivityLog) => new Date(l.timestamp) > new Date(latestKnown)
                    );
                    if (newItems.length > 0) {
                        setPending((prev) => [...newItems, ...prev]);
                    }
                }
            } catch (error) {
                console.error('Error in activity feed polling:', error);
            }
        }, pollInterval);

        return () => clearInterval(interval);
    }, [logs, pollInterval, autoFetch, loadLogs]);

    const loadPending = useCallback(() => {
        setLogs((prev) => [...pending, ...prev].slice(0, maxEvents));
        setPending([]);
    }, [pending, maxEvents]);

    const refresh = useCallback(() => {
        loadLogs();
        setPending([]);
    }, [loadLogs]);

    return {
        logs,
        pending,
        isLoading,
        loadPending,
        refresh,
        pendingCount: pending.length,
    };
}