// Toolbar de filtros y exportación
import { ReportsFilters } from './ReportsFilters';
import type { ReportsFiltersValue } from './ReportsFilters';
import { Notification } from '../../../../components/ui/Notification';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';

export interface ReportsToolbarProps {
    filters: ReportsFiltersValue;
    setFilters: (value: ReportsFiltersValue) => void;
    minDate?: string;
    maxDate?: string;
    notif: { open: boolean; type: 'success' | 'error'; message: string };
    setNotif: (n: { open: boolean; type: 'success' | 'error'; message: string }) => void;
    exportLoading: 'csv' | 'xlsx' | 'pdf' | null;
    showExportModal: boolean;
    setShowExportModal: (b: boolean) => void;
    exportFormat: 'csv' | 'xlsx' | 'pdf';
    setExportFormat: (f: 'csv' | 'xlsx' | 'pdf') => void;
    handleExport: () => void;
}
type ExportFormat = 'csv' | 'xlsx' | 'pdf';
/**
 * Presenta filtros y controles de exportación, sin lógica de negocio.
 */
export function ReportsToolbar({
    filters, setFilters, minDate, maxDate,
    notif, setNotif, exportLoading, showExportModal, setShowExportModal,
    exportFormat, setExportFormat, handleExport
}: ReportsToolbarProps) {
    return (
        <div>
            <ReportsFilters value={filters} onChange={setFilters} minDate={minDate} maxDate={maxDate} />
            {/* Export select y botón */}
            <select value={exportFormat} onChange={e => setExportFormat(e.target.value as ExportFormat)} disabled={!!exportLoading}>
                <option value="csv">CSV</option>
                <option value="xlsx">Excel</option>
                <option value="pdf">PDF</option>
            </select>
            <button type="button" onClick={() => setShowExportModal(true)} disabled={!!exportLoading}>
                Exportar
            </button>
            <ConfirmModal open={showExportModal} onConfirm={handleExport} onCancel={() => setShowExportModal(false)} message="¿Estás seguro de que deseas exportar los datos?" />
            <Notification open={notif.open} type={notif.type} message={notif.message} onClose={() => setNotif({ ...notif, open: false })} />
        </div>
    );
}
