import styles from '../AdminReports.module.css';

type OrdersTableFilters = {
    status: string[];
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
    const handleAddStatus = (status: string) => {
        if (!ordersTableFilters.status.includes(status)) {
            setOrdersTableFilters(f => ({ ...f, status: [...f.status, status] }));
        }
    };

    const handleRemoveStatus = (status: string) => {
        setOrdersTableFilters(f => ({
            ...f,
            status: f.status.filter(s => s !== status),
        }));
    };

    return (
        <div className={styles.advancedFiltersWrap}>
            <label className={styles.advancedLabel}>
                Estado
                <select
                    value="" // 👈 siempre vacío para que no marque nada
                    onChange={e => {
                        e.preventDefault();
                        const val = e.target.value;
                        if (val) handleAddStatus(val);
                    }}
                    className={styles.advancedMultiSelect}
                >
                    <option value="">Seleccionar estado...</option>
                    {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </label>

            {/* Chips de estados seleccionados */}
            <div className={styles.statusChips}>
                {ordersTableFilters.status.map(s => {
                    const label = STATUS_OPTIONS.find(o => o.value === s)?.label || s;
                    return (
                        <span key={s} className={styles.chip}>
                            {label}
                            <button
                                type="button"
                                className={styles.chipClose}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleRemoveStatus(s)
                                }}
                            >
                                ✕
                            </button>
                        </span>
                    );
                })}
            </div>
        </div>
    );
}