import React, { useMemo } from 'react';
import styles from '../AdminReports.module.css';
import { Dropdown } from '../../../../components/ui/Dropdown/Dropdown';

type OrdersTableFilters = {
    status: string;
    clientQuery: string;
    productQuery: string;
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'en-preparacion', label: 'En preparación' },
    { value: 'enviado', label: 'Enviado' },
    { value: 'entregado', label: 'Entregado' },
    { value: 'cancelado', label: 'Cancelado' },
];

interface OrdersFiltersProps {
    ordersTableFilters: OrdersTableFilters;
    setOrdersTableFilters: React.Dispatch<React.SetStateAction<OrdersTableFilters>>;
}

export function OrdersFilters({ ordersTableFilters, setOrdersTableFilters }: OrdersFiltersProps) {
    const handleStatusChange = (status: string) => {
        setOrdersTableFilters((f) => ({
            ...f,
            status: status || '',
        }));
    };

    const statusDropdownOptions = useMemo(() => [
        { value: '', label: 'Seleccionar estado...' },
        ...STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
        }))
    ], []);

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

    return (
        <div
            className={styles.advancedFiltersWrap}
            style={isMobile ? { flexDirection: 'column', gap: 10, width: '100%' } : {}}
        >
            <div className={styles.advancedLabel} style={{ width: isMobile ? '100%' : '180px' }}>
                <strong style={{ display: 'block', marginBottom: '8px' }}>Estado</strong>
                <Dropdown
                    options={statusDropdownOptions}
                    value={ordersTableFilters.status}
                    onChange={(val) => handleStatusChange(val)}
                    placeholder="Seleccionar estado..."
                />
            </div>
        </div>
    );
}