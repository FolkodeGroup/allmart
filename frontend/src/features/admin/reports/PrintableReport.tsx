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
    topProducts?: Array<{ id: string; name: string; qty: number; revenue: number }>;
    topClients?: Array<{ name: string; email: string; total: number; orders: number }>;
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

function AllmartVectorLogo({ height = 26 }: { height?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 410.87 188.52"
            style={{ height: `${height}px`, width: 'auto', display: 'block' }}
            aria-label="Allmart"
        >
            <path fill="#ffffff" d="M109.59,96.99l-21.16,22.33c-.44.46-.9.89-1.4,1.28-.53.42-1.22.94-1.71,1.24-2.37,1.44-5.04,2.16-8.03,2.16s-5.55-.69-7.3-2.06c-1.75-1.37-2.63-3.23-2.63-5.56,0-2.06.71-3.79,2.14-5.2,1.43-1.41,4.22-2.11,8.37-2.11h12.55v.07l12.11-12.81c-.07-1.63-.8-4.02-.8-4.02-.03-.09-.06-.18-.08-.26,0-.02-.02-.06-.02-.06-1.18-3.96-3.12-7.07-5.86-9.28-4.29-3.46-11.06-5.19-20.29-5.19h-15.56v10.34l16.23.11c4.43,0,7.12.09,9.06,1.11,3.44,1.8,4.78,4.3,4.98,6.05.18,1.57.23,3.3.23,4.58v.82h-13.43c-5.25,0-9.47.72-12.65,2.16-3.18,1.44-5.47,3.4-6.86,5.87-1.4,2.47-2.09,5.25-2.09,8.34s.79,5.99,2.38,8.5c1.59,2.51,3.84,4.46,6.76,5.87,2.92,1.41,6.33,2.11,10.22,2.11,4.61,0,8.42-.89,11.44-2.68,2.08-1.23,3.71-2.81,4.91-4.73v6.69h11.48v-16.47l6.99-7.4v23.87h12.16V56.24h-12.16v40.76Z"/>
            <rect fill="#ffffff" x="128.87" y="56.24" width="12.16" height="76.42"/>
            <path fill="#ffffff" d="M225.55,79.62c-3.21-1.71-6.89-2.57-11.04-2.57-5.13,0-9.63,1.24-13.53,3.71-2.39,1.52-4.37,3.36-5.93,5.5-1.24-2.19-2.84-4-4.83-5.4-3.6-2.54-7.83-3.81-12.7-3.81-4.28,0-8.09.93-11.43,2.78-2.22,1.23-4.08,2.85-5.6,4.84v-7h-11.58v55h12.16v-27.91c0-3.71.57-6.76,1.7-9.17,1.13-2.4,2.73-4.22,4.77-5.46,2.04-1.24,4.39-1.85,7.06-1.85,3.76,0,6.65,1.2,8.66,3.61,2.01,2.4,3.02,6.04,3.02,10.92v29.87h12.16v-27.91c0-3.71.57-6.76,1.7-9.17,1.13-2.4,2.72-4.22,4.77-5.46,2.04-1.24,4.39-1.85,7.06-1.85,3.76,0,6.65,1.2,8.66,3.61,2.01,2.4,3.02,6.04,3.02,10.92v29.87h12.16v-31.52c0-5.56-.91-10.11-2.73-13.65-1.82-3.54-4.33-6.16-7.54-7.88Z"/>
            <path fill="#ffffff" d="M304.46,85.35l-.26-.27v-7.42h-11.58v19.33l-7,7.4v-.07l-14.17,15c-.44.46-.9.89-1.4,1.28-.53.42-1.22.94-1.71,1.24-2.37,1.44-5.04,2.16-8.03,2.16s-5.55-.69-7.3-2.06c-1.75-1.37-2.63-3.23-2.63-5.56,0-2.06.71-3.79,2.14-5.2,1.43-1.41,4.22-2.11,8.37-2.11h12.55s12.11-12.81,12.11-12.81c-.07-1.63-.8-3.96-.8-3.96-.03-.09-.06-.18-.08-.26,0-.02-.02-.06-.02-.06-1.18-3.96-3.12-7.07-5.86-9.28-4.29-3.46-11.06-5.19-20.29-5.19h-15.56v10.34l16.23.11c4.43,0,7.12.09,9.06,1.11,3.44,1.8,4.78,4.3,4.98,6.05.18,1.57.23,3.3.23,4.58v.82h-13.43c-5.25,0-9.47.72-12.65,2.16-3.18,1.44-5.47,3.4-6.86,5.87-1.4,2.47-2.09,5.25-2.09,8.34s.79,5.99,2.38,8.5c1.59,2.51,3.84,4.46,6.76,5.87,2.92,1.41,6.33,2.11,10.22,2.11,4.61,0,8.42-.89,11.44-2.68,2.08-1.23,3.71-2.81,4.91-4.73v6.69h11.48v-16.47l7-7.4v23.87h12.16v-26.68c0-5.63,1.36-9.87,4.09-12.72,2.73-2.85,6.39-4.27,11-4.27.45,0,.91.02,1.36.05.45.04.94.12,1.46.26v-12.26c-5,0-9.16.96-12.51,2.88-2.36,1.36-4.26,3.18-5.73,5.43Z"/>
            <path fill="#ffffff" d="M351.95,120.51c-1.82,1.51-4.09,2.27-6.81,2.27-2.27,0-4.04-.72-5.3-2.16-1.27-1.44-1.9-3.47-1.9-6.08v-26.57h13.92v-10.3h-13.92v-21.28h-12.16v58.47c0,6.11,1.56,10.73,4.67,13.85,3.11,3.13,7.53,4.69,13.24,4.69,2.2,0,4.34-.31,6.42-.93,2.08-.62,3.83-1.55,5.26-2.78l-3.41-9.17Z"/>
        </svg>
    );
}

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
            topProducts = [],
            topClients = [],
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
                    {/* BANNER ENCABEZADO INSTITUCIONAL CON LOGO VECTORIAL OFICIAL */}
                    <header
                        style={{
                            background: 'linear-gradient(135deg, #5D7568, #769282)',
                            borderRadius: 12,
                            color: '#ffffff',
                            padding: '16px 22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 20,
                            boxShadow: '0 4px 12px rgba(118, 146, 130, 0.25)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <AllmartVectorLogo height={26} />
                            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: 14 }}>
                                <h1 style={{ fontSize: 18, margin: 0, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
                                    Reporte de Gestión y Ventas
                                </h1>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 10, lineHeight: 1.4, opacity: 0.95 }}>
                            <div><b>Fecha:</b> {now}</div>
                            <div><b>Período:</b> {periodLabel}</div>
                        </div>
                    </header>

                    {/* FILTROS APLICADOS */}
                    <section style={{ marginBottom: 16 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #E5E2DD' }}>
                            <tbody>
                                {ordersTableFilters?.status && ordersTableFilters.status.length > 0 && (
                                    <tr>
                                        <td style={cellLabel}>Estados seleccionados</td>
                                        <td style={cellValue}>
                                            {ordersTableFilters.status.join(', ')}
                                        </td>
                                    </tr>
                                )}
                                {ordersTableFilters?.clientQuery && (
                                    <tr>
                                        <td style={cellLabel}>Cliente filtrado</td>
                                        <td style={cellValue}>
                                            {ordersTableFilters.clientQuery}
                                        </td>
                                    </tr>
                                )}
                                {ordersTableFilters?.productQuery && (
                                    <tr>
                                        <td style={cellLabel}>Producto filtrado</td>
                                        <td style={cellValue}>
                                            {ordersTableFilters.productQuery}
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

                    {/* GRÁFICOS Y TABLAS DE RESUMEN */}
                    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
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

                    {/* TOP PRODUCTOS & TOP CLIENTES */}
                    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {topProducts.length > 0 && (
                            <div style={{ ...box, border: '1px solid #E5E2DD' }}>
                                <h3 style={title}>Top Productos Más Vendidos</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 10 }}>
                                    <thead>
                                        <tr style={{ background: '#5D7568', color: '#FFFFFF' }}>
                                            <th style={tableHeadCell}>Producto</th>
                                            <th style={{ ...tableHeadCell, textAlign: 'center' }}>Unidades</th>
                                            <th style={{ ...tableHeadCell, textAlign: 'right' }}>Recaudación</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topProducts.slice(0, 5).map((p, idx) => (
                                            <tr key={p.id} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E5E2DD' }}>
                                                <td style={tableBodyCell}><b>{p.name}</b></td>
                                                <td style={{ ...tableBodyCell, textAlign: 'center', fontWeight: 600 }}>{p.qty} un.</td>
                                                <td style={{ ...tableBodyCell, textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatCurrency(p.revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {topClients.length > 0 && (
                            <div style={{ ...box, border: '1px solid #E5E2DD' }}>
                                <h3 style={title}>Top Clientes del Período</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 10 }}>
                                    <thead>
                                        <tr style={{ background: '#5D7568', color: '#FFFFFF' }}>
                                            <th style={tableHeadCell}>Cliente</th>
                                            <th style={{ ...tableHeadCell, textAlign: 'center' }}>Pedidos</th>
                                            <th style={{ ...tableHeadCell, textAlign: 'right' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topClients.slice(0, 5).map((c, idx) => (
                                            <tr key={c.email} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E5E2DD' }}>
                                                <td style={tableBodyCell}>
                                                    <b>{c.name}</b>
                                                    <div style={{ fontSize: 8.5, color: '#64748b' }}>{c.email}</div>
                                                </td>
                                                <td style={{ ...tableBodyCell, textAlign: 'center', fontWeight: 600 }}>{c.orders}</td>
                                                <td style={{ ...tableBodyCell, textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatCurrency(c.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
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