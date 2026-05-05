import React from 'react';

interface OrderRecord {
    id?: string;
    createdAt?: string;
    total?: number;
    clientName?: string;
    clientEmail?: string;
    status?: string;
}

interface SalesTableViewProps {
    orders: OrderRecord[];
    formatPrice: (n: number) => string;
    dayKeys?: string[];
}

export const SalesTableView: React.FC<SalesTableViewProps> = (_props) => {
    return null;
};
