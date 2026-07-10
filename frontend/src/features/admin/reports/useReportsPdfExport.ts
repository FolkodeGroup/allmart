import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Hook para exportar un resumen visual de reportes a PDF.
 * Captura secciones del DOM y genera un PDF con KPIs, gráficos y tabla/resumen.
 *
 * @returns { generatePdf: (options: { rootRef: React.RefObject<HTMLElement>, fileName: string }) => Promise<void>, loading: boolean }
 */
import { useState } from 'react';
import type { RefObject } from 'react';

export function useReportsPdfExport() {
    const [loading, setLoading] = useState(false);

    /**
     * Genera un PDF a partir de un nodo raíz (rootRef) que contiene el resumen visual.
     * @param rootRef Ref al contenedor DOM a capturar (puede ser HTMLDivElement, HTMLElement, etc)
     * @param fileName Nombre del archivo PDF
     */
    async function generatePdf({ rootRef, fileName }: { rootRef: RefObject<HTMLElement | null>, fileName: string }) {
        if (!rootRef.current) return;
        setLoading(true);
        try {
            const pages = rootRef.current.querySelectorAll('[class^="pdf-page"]');

            const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 24;

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i] as HTMLElement;

                const canvas = await html2canvas(page, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    scrollX: 0,
                    scrollY: 0,
                    windowWidth: page.scrollWidth,
                    windowHeight: page.scrollHeight,
                });

                const imgData = canvas.toDataURL('image/png');
                const maxWidth = pageWidth - margin * 2;
                const maxHeight = pageHeight - margin * 2;
                const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
                const imgWidth = canvas.width * scale;
                const imgHeight = canvas.height * scale;
                const x = (pageWidth - imgWidth) / 2;
                const y = (pageHeight - imgHeight) / 2;

                if (i > 0) pdf.addPage();

                pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            }

            pdf.save(fileName);
        } finally {
            setLoading(false);
        }
    }

    return { generatePdf, loading };
}
