// Centraliza exportación y feedback
import { useState } from 'react';
import { exportOrdersCSV, exportOrdersXLSX, exportOrdersPDF, getExportFileName } from '../../../../utils/exportHelpers';
import type { Order } from '../../../../context/AdminOrdersContext';

/**
 * Maneja exportación, loading y feedback de usuario.
 */
type Filters =
    | { type: 'predefined'; period: string }
    | { type: 'custom' };

export function useReportsExport(
    periodOrders: Order[],
    filters: Filters
) {
    const [notif, setNotif] = useState({
        open: false,
        type: 'success' as 'success' | 'error',
        message: ''
    });

    const [exportLoading, setExportLoading] = useState<'csv' | 'xlsx' | 'pdf' | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');

    const handleExport = async () => {
        if (exportLoading) return;

        if (!periodOrders.length) {
            setNotif({
                open: true,
                type: 'error',
                message: 'No hay datos para exportar.'
            });
            return;
        }

        setExportLoading(exportFormat);
        setShowExportModal(false);

        const periodLabel =
            filters.type === 'predefined'
                ? filters.period
                : 'custom';

        const fileName = getExportFileName('pedidos', periodLabel, exportFormat);

        try {
            if (exportFormat === 'csv') await exportOrdersCSV(periodOrders, fileName);
            else if (exportFormat === 'xlsx') await exportOrdersXLSX(periodOrders, fileName);
            else if (exportFormat === 'pdf') await exportOrdersPDF(periodOrders, fileName);

            setNotif({
                open: true,
                type: 'success',
                message: `Exportación exitosa. Archivo ${exportFormat.toUpperCase()} descargado.`
            });
        } catch (error) {
            console.error('Export error:', error);

            setNotif({
                open: true,
                type: 'error',
                message: `Ocurrió un error al exportar (${exportFormat.toUpperCase()}).`
            });
        } finally {
            setExportLoading(null);
        }
    };

    return {
        notif, setNotif,
        exportLoading,
        showExportModal, setShowExportModal,
        exportFormat, setExportFormat,
        handleExport
    };
}