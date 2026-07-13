import React, { useEffect, useMemo, useState, Suspense } from 'react';
import type { ReportsFiltersValue } from './components/ReportsFilters';
import type { OrdersTableProps } from './AdminReports';
import { OrdersTable } from './components/OrdersTable';
import { chunkOrdersForPDF } from './components/chunkOrdersForPDF';
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
    ordersTableFilters?: {
        status?: string[];
        clientQuery?: string;
        productQuery?: string;
    };
}

const DonutChart = React.lazy(() => import('./components/DonutChart'));

const PRINT_PAGE_WIDTH = 794;
const PRINT_PAGE_HEIGHT = 1123;

const projectPalette = {
    primary: '#769282',
    primaryDark: '#5d7568',
    accent: '#DDB08C',
    bgSecondary: '#F2EFEB',
    bgTertiary: '#F9F7F4',
    textPrimary: '#1A1A1A',
    textSecondary: '#4A4A4A',
    border: '#E5E2DD',
    borderLight: '#F0EDE8',
};

function formatCurrency(value: number) {
    return `$${value.toLocaleString('es-AR')}`;
}

function groupByWeek(data: Array<{ dateKey: string; label: string; value: number }>) {
    const grouped: Record<string, { label: string; value: number }> = {};

    for (const item of data) {
        const date = new Date(item.dateKey);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const weekOfMonth = Math.ceil(date.getDate() / 7);
        const key = `${year}-${month}-S${weekOfMonth}`;
        if (!grouped[key]) {
            grouped[key] = { label: `${year}-${month}-S${weekOfMonth}`, value: 0 };
        }
        grouped[key].value += item.value;
    }

    return Object.values(grouped);
}

function renderSalesTable(data: Array<{ dateKey: string; label: string; value: number }>) {
    const rows = data.length > 12 ? groupByWeek(data) : data;
    return (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
                <tr>
                    <th style={tableHeadCell}>Periodo</th>
                    <th style={tableHeadCell}>Ventas</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((item, index) => (
                    <tr key={index} style={{ background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={tableBodyCell}>{item.label}</td>
                        <td style={{ ...tableBodyCell, textAlign: 'right' }}>{formatCurrency(item.value)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

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
        const orders = useMemo(() => ordersTableProps.orders ?? [], [ordersTableProps.orders]);

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
                    background: projectPalette.bgTertiary,
                    color: projectPalette.textPrimary,
                    padding: '24px',
                    margin: '0 auto',
                    width: PRINT_PAGE_WIDTH,
                    fontFamily: 'Inter, Arial, sans-serif',
                    fontSize: 11,
                    lineHeight: 1.45,
                    boxSizing: 'border-box',
                }}
            >
                {/* 🟢 PÁGINA 1 (RESUMEN) */}
                <div className="pdf-page-1" style={pageFrameStyle}>
                    {/* HEADER */}
                    <header style={{ marginBottom: 20, borderBottom: `2px solid ${projectPalette.primary}`, paddingBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: projectPalette.primary }}>
                                    Resumen administrativo
                                </div>
                                <h1 style={{ fontSize: 22, margin: '4px 0 0', color: '#111827' }}>
                                    REPORTE DE PEDIDOS
                                </h1>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: 10, color: projectPalette.textSecondary }}>
                                <div><b>Fecha:</b> {now}</div>
                                <div><b>Período:</b> {periodLabel}</div>
                            </div>
                        </div>
                    </header>
                    {/* FILTROS */}
                    <section style={{ marginBottom: 18 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
                            <tbody>
                                {ordersTableFilters?.status && (
                                    <tr>
                                        <td style={cellLabel}>Estados</td>
                                        <td style={cellValue}>
                                            {ordersTableFilters.status.join(', ') || 'Todos'}
                                        </td>
                                    </tr>
                                )}
                                {ordersTableFilters?.clientQuery && (
                                    <tr>
                                        <td style={cellLabel}>Cliente</td>
                                        <td style={cellValue}>
                                            {ordersTableFilters.clientQuery || 'Todos'}
                                        </td>
                                    </tr>
                                )}
                                {ordersTableFilters?.productQuery && (
                                    <tr>
                                        <td style={cellLabel}>Producto</td>
                                        <td style={cellValue}>
                                            {ordersTableFilters.productQuery || 'Todos'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>
                    {/* KPIs */}
                    <section style={{ marginBottom: 20 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
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
                            gap: 16,
                        }}
                    >
                        <div style={{ ...box, border: '1px solid #dbe2ea', padding: 14 }}>
                            <h3 style={title}>Ventas</h3>
                            <div style={{ fontSize: 10, color: projectPalette.textSecondary, marginBottom: 10 }}>
                                Se muestra el resumen de ventas de manera tabular para impresión.
                            </div>
                            {renderSalesTable(barData)}
                        </div>
                        <div
                            style={{
                                ...box,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #dbe2ea',
                                padding: 14,
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
                            ...pageFrameStyle,
                            pageBreakBefore: 'always',
                            marginTop: 18,
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <h3 style={{ margin: 0, fontSize: 15, color: '#111827' }}>
                                Detalle de pedidos
                            </h3>
                            <span style={{ fontSize: 10, color: '#475569' }}>
                                Página {index + 2} · {chunk.length} pedidos
                            </span>
                        </div>
                        <div style={{ marginBottom: 10, fontSize: 10, color: '#475569' }}>
                            <b>Total de pedidos:</b> {orders.length}
                        </div>
                        <div style={{ border: '1px solid #dbe2ea', padding: 8, background: '#fff' }}>
                            <OrdersTable orders={chunk} printMode />
                        </div>
                        <div style={{ fontSize: 9, marginTop: 8, color: '#64748b', textAlign: 'right' }}>
                            Generado el {now}
                        </div>
                    </div>
                ))}
            </div>
        );
    }
);

PrintableReport.displayName = 'PrintableReport';

/* 🔹 estilos reutilizables */
const pageFrameStyle: React.CSSProperties = {
    background: '#ffffff',
    color: projectPalette.textPrimary,
    border: `1px solid ${projectPalette.border}`,
    borderRadius: 10,
    padding: '20px 22px 24px',
    width: PRINT_PAGE_WIDTH,
    minHeight: PRINT_PAGE_HEIGHT,
    boxSizing: 'border-box',
    margin: '0 auto 18px',
};

const cellLabel: React.CSSProperties = {
    fontWeight: 700,
    border: `1px solid ${projectPalette.border}`,
    padding: '7px 8px',
    width: '30%',
    background: projectPalette.bgSecondary,
    color: projectPalette.primaryDark,
};

const cellValue: React.CSSProperties = {
    border: `1px solid ${projectPalette.border}`,
    padding: '7px 8px',
    color: projectPalette.textPrimary,
};

const thStyle: React.CSSProperties = {
    border: `1px solid ${projectPalette.border}`,
    padding: '8px 10px',
    background: projectPalette.bgSecondary,
    textAlign: 'center',
    color: projectPalette.primaryDark,
    fontSize: 11,
};

const tdStyle: React.CSSProperties = {
    border: `1px solid ${projectPalette.border}`,
    padding: '8px 10px',
    textAlign: 'center',
    color: projectPalette.textPrimary,
};

const tableHeadCell: React.CSSProperties = {
    border: `1px solid ${projectPalette.border}`,
    padding: '8px 10px',
    background: projectPalette.bgSecondary,
    textAlign: 'left',
    color: projectPalette.primaryDark,
    fontSize: 11,
    fontWeight: 700,
};

const tableBodyCell: React.CSSProperties = {
    border: `1px solid ${projectPalette.border}`,
    padding: '8px 10px',
    fontSize: 11,
    color: projectPalette.textPrimary,
};

const box: React.CSSProperties = {
    borderRadius: 8,
    padding: 12,
    background: '#fff',
};

const title: React.CSSProperties = {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
};