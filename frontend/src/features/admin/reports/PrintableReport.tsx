import React, { useEffect, useState, Suspense } from 'react';
import type { ReportsFiltersValue } from './components/ReportsFilters';
import type { OrdersTableProps } from './AdminReports';
import { OrdersTable } from './components/OrdersTable';
import { generateMockOrders } from "./components/DatosMockeados";
import { chunkOrdersForPDF } from "./components/chunkOrdersForPDF";
// import { flushSync } from 'react-dom';

export interface PrintableReportProps {
    filters: ReportsFiltersValue;
    metrics: Array<{
        key: string;
        icon: string;
        label: string;
        value: string | number;
        trend?: number;
    }>;
    barData: Array<{ dateKey: string; label: string; value: number }>;
    statusSlices: Array<{ key: string; count: number }>;
    periodLabel: string;
    ordersTableProps: OrdersTableProps;
    ordersTableFilters: {
        status: string[];
        clientQuery: string;
        productQuery: string;
    };
}

const BarChart = React.lazy(() => import('./components/BarChart'));
const DonutChart = React.lazy(() => import('./components/DonutChart'));
// IMPORTA DATOS MOCKEADOS PARA PRUEBA


export const PrintableReport = React.forwardRef<HTMLDivElement, PrintableReportProps>(
    (
        {
            filters: _filters,
            metrics,
            barData,
            statusSlices,
            periodLabel,
            ordersTableProps,
            ordersTableFilters,
        },
        ref
    ) => {
        const now = new Date().toLocaleString('es-AR');

        // --- USAR DATOS MOCKEADOS PARA DEBUG DE PAGINACIÓN ---
        // const orders = ordersTableProps.orders; // ← Descomenta esta línea para usar los pedidos reales
        const orders = generateMockOrders(31) // ← Comenta esta línea para usar los pedidos reales

        const [ordersChunks, setOrdersChunks] = useState<typeof orders[]>([]);
        useEffect(() => {
            let cancelled = false;
            const run = async () => {
                if (!orders.length) {
                    setOrdersChunks([]);
                    return;
                }
                // Usa el helper para chunking dinámico
                const MAX_HEIGHT = 1100; // A4 aprox. 1100px
                const chunks = await chunkOrdersForPDF(orders, MAX_HEIGHT, { ...ordersTableProps });
                if (!cancelled) setOrdersChunks(chunks);
            };
            run();
            return () => { cancelled = true; };
        }, [orders, ordersTableProps]);

        return (
            <div
                ref={ref}
                style={{
                    background: '#fff',
                    color: '#000',
                    padding: "2rem",
                    margin: "1rem",
                    width: 900,
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 12,
                    lineHeight: 1.4,
                }}
            >
                {/* 🟢 PÁGINA 1 (RESUMEN) */}
                <div className="pdf-page-1">
                    {/* HEADER */}
                    <header style={{ marginBottom: 24 }}>
                        <h1 style={{ fontSize: 22, margin: 0 }}>
                            REPORTE DE PEDIDOS
                        </h1>
                        <div style={{ marginTop: 8 }}>
                            <div><b>Fecha de generación:</b> {now}</div>
                            <div><b>Período:</b> {periodLabel}</div>
                        </div>
                    </header>
                    {/* FILTROS */}
                    <section style={{ marginBottom: 24 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={cellLabel}>Estados</td>
                                    <td style={cellValue}>
                                        {ordersTableFilters.status.join(', ') || 'Todos'}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={cellLabel}>Cliente</td>
                                    <td style={cellValue}>
                                        {ordersTableFilters.clientQuery || 'Todos'}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={cellLabel}>Producto</td>
                                    <td style={cellValue}>
                                        {ordersTableFilters.productQuery || 'Todos'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </section>
                    {/* KPIs */}
                    <section style={{ marginBottom: 32 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {metrics.map(m => (
                                        <th key={m.key} style={thStyle}>
                                            {m.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    {metrics.map(m => (
                                        <td key={m.key} style={tdStyle}>
                                            {m.value}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </section>
                    {/* GRÁFICOS */}
                    <section
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 24,
                        }}
                    >
                        <div style={{ ...box, border: "none" }}>
                            <h3 style={title}>Ventas</h3>
                            <Suspense fallback="Cargando gráfico...">
                                <BarChart
                                    data={barData}
                                    formatValue={(n: number) =>
                                        `$${n.toLocaleString('es-AR')}`
                                    }
                                />
                            </Suspense>
                        </div>
                        <div
                            style={{
                                ...box,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <div>
                                <h3 style={title}>Pedidos por estado</h3>
                                <Suspense fallback="Cargando gráfico...">
                                    <DonutChart slices={statusSlices} />
                                </Suspense>
                            </div>
                        </div>
                    </section>
                </div>
                {/* 🟢 SALTO VISUAL */}
                {/* 🟢 PÁGINA 2 (TABLA) */}
                {ordersChunks.map((chunk, index) => (
                    <div
                        key={index}
                        className={`pdf-page-${index + 2}`}
                        style={{
                            pageBreakBefore: 'always',
                            border: '2px solid red', // DEBUG: visualiza cada página
                            marginBottom: 24,
                        }}
                    >
                        <h3 style={{ marginBottom: 8 }}>
                            Detalle de pedidos
                        </h3>
                        <div style={{ marginBottom: 12 }}>
                            <b>Total de pedidos:</b> {orders.length}
                        </div>
                        <div style={{ border: '1px solid #000', padding: 8 }}>
                            {/* Fuerza que cada fila ocupe más espacio para debug visual del paginado */}
                            <div style={{ height: 24 }} />
                            <OrdersTable orders={chunk} />
                            <div style={{ height: 24 }} />
                        </div>
                        <div style={{ fontSize: 10, color: '#c00', marginTop: 8 }}>
                            Página de tabla #{index + 2} - Pedidos en esta página: {chunk.length}
                        </div>
                    </div>
                ))}
            </div>
        );
    }
);

PrintableReport.displayName = 'PrintableReport';

/* 🔹 estilos reutilizables */
const cellLabel: React.CSSProperties = {
    fontWeight: 600,
    border: '1px solid #000',
    padding: 6,
    width: '30%',
};

const cellValue: React.CSSProperties = {
    border: '1px solid #000',
    padding: 6,
};

const thStyle: React.CSSProperties = {
    border: '1px solid #000',
    padding: 8,
    background: '#eee',
    textAlign: 'center',
};

const tdStyle: React.CSSProperties = {
    border: '1px solid #000',
    padding: 8,
    textAlign: 'center',
};

const box: React.CSSProperties = {
    border: '1px solid #000',
    padding: 12,
};

const title: React.CSSProperties = {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 600,
};