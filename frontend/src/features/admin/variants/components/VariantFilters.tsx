import { X } from "lucide-react";
import Tooltip from '@mui/material/Tooltip';
import styles from '../AdminVariants.module.css';

type VariantConfig = {
    name: string;
    values: string[];
};

type Filters = {
    search: string;
    status: "all" | "active" | "inactive";
    dynamic: Record<string, string>
};

type Props = {
    filters: Filters;
    variantsConfig: VariantConfig[];
    onChange: (filters: Filters) => void;
    onReset: () => void;
};

export function VariantsFilters({
    filters,
    onChange,
    variantsConfig,
    onReset,
}: Props) {

    // helper para actualizar filtros
    const update = (key: keyof Filters, value: Filters[keyof Filters]) => {
        onChange({
            ...filters,
            [key]: value,
        });
    };

    return (
        <div
            className={styles.filtersContainer}
            role="search"
            aria-label="Filtros de variantes"
        >
            <span>Filtros:</span>

            {/* 🔍 búsqueda */}
            <div className={styles.filterField}>
                <Tooltip title="Buscar por nombre de variante">
                    <input
                        type="text"
                        placeholder="Buscar tipo..."
                        value={filters.search}
                        onChange={(e) => update("search", e.target.value)}
                        className={styles.filterInput}
                    />
                </Tooltip>
            </div>

            {/* 📊 estado */}
            <div className={styles.filterField}>
                <Tooltip title="Filtrar por estado">
                    <select
                        value={filters.status}
                        onChange={(e) =>
                            update("status", e.target.value as Filters["status"])
                        }
                        className={styles.filterSelect}
                    >
                        <option value="all">Todos</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                    </select>
                </Tooltip>
            </div>

            {/* 🧠 filtros dinámicos */}
            {variantsConfig.map((variant) => (
                <div key={variant.name} className={styles.filterField}>
                    <Tooltip title={`Filtrar por ${variant.name}`}>
                        <select
                            value={filters.dynamic[variant.name] || ""}
                            onChange={(e) =>
                                onChange({
                                    ...filters,
                                    dynamic: {
                                        ...filters.dynamic,
                                        [variant.name]: e.target.value,
                                    },
                                })
                            }
                            className={styles.filterSelect}
                        >
                            <option value="">{variant.name}</option>

                            {variant.values.map((val) => (
                                <option key={val} value={val}>
                                    {val}
                                </option>
                            ))}
                        </select>
                    </Tooltip>
                </div>
            ))}

            {/* ❌ reset */}
            <Tooltip title="Limpiar filtros">
                <button
                    type="button"
                    onClick={onReset}
                    className={styles.filterResetBtn}
                >
                    <X size={16} />
                    <span>Limpiar</span>
                </button>
            </Tooltip>
        </div>
    );
}