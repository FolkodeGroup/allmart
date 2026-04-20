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

export const SalesTableView: React.FC<SalesTableViewProps> = ({ orders, formatPrice, dayKeys }) => {
    if (!orders || orders.length === 0) {
        return <p style={{ padding: 16, textAlign: 'center', color: '#888' }}>Sin ventas en este período.</p>;
    }

    // Si dayKeys está presente, mostrar tabla por días (resumen)
    if (dayKeys && dayKeys.length > 0) {
        // Agrupar ventas por día
        const salesByDay: Record<string, number> = {};
        orders.forEach(order => {
            const key = order.createdAt?.slice(0, 10) || '';
            salesByDay[key] = (salesByDay[key] || 0) + (order.total ?? 0);
        });
        return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', padding: 8 }}>Día</th>
                        <th style={{ textAlign: 'right', padding: 8 }}>Ventas</th>
                    </tr>
                </thead>
                <tbody>
                    {dayKeys.map(day => (
                        <tr key={day}>
                            <td style={{ padding: 8 }}>{day}</td>
                            <td style={{ padding: 8, textAlign: 'right' }}>{formatPrice(salesByDay[day] || 0)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    // Tabla detallada de pedidos
    return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr>
                    <th style={{ textAlign: 'left', padding: 8 }}>Fecha</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Cliente</th>
                    <th style={{ textAlign: 'right', padding: 8 }}>Total</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Estado</th>
                </tr>
            </thead>
            <tbody>
                {orders.map(order => (
                    <tr key={order.id}>
                        <td style={{ padding: 8 }}>{order.createdAt?.slice(0, 10)}</td>
                        <td style={{ padding: 8 }}>{order.clientName || order.clientEmail || '-'}</td>
                        <td style={{ padding: 8, textAlign: 'right' }}>{formatPrice(order.total ?? 0)}</td>
                        <td style={{ padding: 8 }}>{order.status}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
