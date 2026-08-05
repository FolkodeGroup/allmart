import React, { useEffect, useMemo, useState, Suspense } from 'react';
import type { ReportsFiltersValue } from './components/ReportsFilters';
import type { OrdersTableProps } from './AdminReports';
import { OrdersTable } from './components/OrdersTable';
import { chunkOrdersForPDF } from './components/chunkOrdersForPDF';

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
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    border: '#E5E2DD',
    borderLight: '#F0EDE8',
};

function formatCurrency(value: number) {
    return `$ ${value.toLocaleString('es-AR')}`;
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
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <thead>
                <tr style={{ background: '#5D7568', color: '#FFFFFF' }}>
                    <th style={tableHeadCell}>Período</th>
                    <th style={{ ...tableHeadCell, textAlign: 'right' }}>Ventas</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((item, index) => (
                    <tr key={index} style={{ background: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E5E2DD' }}>
                        <td style={tableBodyCell}>{item.label}</td>
                        <td style={{ ...tableBodyCell, textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatCurrency(item.value)}</td>
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
                const MAX_HEIGHT = 1100;
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
                    background: '#FFFFFF',
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
                {/* 🟢 PÁGINA 1 (RESUMEN EJECUTIVO) */}
                <div className="pdf-page-1" style={pageFrameStyle}>
                    {/* HEADER INSTITUCIONAL */}
                    <header style={{ marginBottom: 16, borderBottom: `2px solid ${projectPalette.primary}`, paddingBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: projectPalette.primary }}>
                                    Allmart — Resumen Administrativo
                                </div>
                                <h1 style={{ fontSize: 22, margin: '4px 0 0', color: '#111827', fontWeight: 800 }}>
                                    REPORTE DE PEDIDOS
                                </h1>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: 10, color: projectPalette.textSecondary }}>
                                <div><b>Fecha:</b> {now}</div>
                                <div><b>Período:</b> {periodLabel}</div>
                            </div>
                        </div>
                    </header>

                    {/* FILTROS APLICADOS */}
                    <section style={{ marginBottom: 16 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #E5E2DD' }}>
                            <tbody>
                                {ordersTableFilters?.status && (
                                    <tr>
                                        <td style={cellLabel}>Estados</td>
                                        <td style={cellValue}>
                                            {ordersTableFilters.status.join(', ') || 'Todos los estados'}
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

                    {/* KPIS DE RESUMEN */}
                    <section style={{ marginBottom: 18 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #E5E2DD' }}>
                            <thead>
                                <tr style={{ background: '#769282', color: '#FFFFFF' }}>
                                    {metrics.map(m => (
                                        <th key={m.key} style={thStyle}>
                                            {m.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ background: '#FFFFFF' }}>
                                    {metrics.map(m => (
                                        <td key={m.key} style={tdStyle}>
                                            {m.value}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    {/* GRÁFICOS Y TABLA DE VENTAS */}
                    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div style={{ ...box, border: '1px solid #E5E2DD' }}>
                            <h3 style={title}>Evolución de Ventas</h3>
                            <div style={{ fontSize: 9.5, color: projectPalette.textSecondary, marginBottom: 8 }}>
                                Resumen en formato tabular para impresión.
                            </div>
                            {renderSalesTable(barData)}
                        </div>
                        <div style={{ ...box, border: '1px solid #E5E2DD' }}>
                            <h3 style={title}>Pedidos por Estado</h3>
                            <Suspense fallback="Cargando gráfico...">
                                <DonutChart slices={statusSlices} />
                            </Suspense>
                        </div>
                    </section>
                </div>

                {/* 🟢 PÁGINA 2+ (DETALLE DE PEDIDOS) */}
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
                            <h3 style={{ margin: 0, fontSize: 15, color: '#111827', fontWeight: 700 }}>
                                Detalle de Pedidos
                            </h3>
                            <span style={{ fontSize: 10, color: '#4B5563', fontWeight: 600 }}>
                                Página {index + 2} · {chunk.length} pedidos ({orders.length} en total)
                            </span>
                        </div>
                        <div style={{ border: '1px solid #E5E2DD', padding: 4, background: '#FFFFFF', borderRadius: 8 }}>
                            <OrdersTable orders={chunk} printMode />
                        </div>
                        <div style={{ fontSize: 9, marginTop: 10, color: '#64748b', textAlign: 'right' }}>
                            Generado el {now}
                        </div>
                    </div>
                ))}
            </div>
        );
    }
);

PrintableReport.displayName = 'PrintableReport';

/* 🔹 Estilos estáticos de alto contraste para PDF */
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
    padding: '6px 10px',
    width: '30%',
    background: projectPalette.bgSecondary,
    color: projectPalette.primaryDark,
    fontSize: 10,
};

const cellValue: React.CSSProperties = {
    border: `1px solid ${projectPalette.border}`,
    padding: '6px 10px',
    color: projectPalette.textPrimary,
    fontSize: 10,
};

const thStyle: React.CSSProperties = {
    border: `1px solid ${projectPalette.border}`,
    padding: '8px 10px',
    background: projectPalette.primary,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 700,
};

const tdStyle: React.CSSProperties = {
    border: `1px solid ${projectPalette.border}`,
    padding: '10px',
    textAlign: 'center',
    color: projectPalette.textPrimary,
    fontSize: 12,
    fontWeight: 700,
};

const tableHeadCell: React.CSSProperties = {
    padding: '6px 10px',
    background: '#5D7568',
    textAlign: 'left',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 700,
};

const tableBodyCell: React.CSSProperties = {
    padding: '6px 10px',
    fontSize: 10,
    color: projectPalette.textPrimary,
};

const box: React.CSSProperties = {
    borderRadius: 8,
    padding: 12,
    background: '#ffffff',
};

const title: React.CSSProperties = {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 700,
    color: '#111827',
};