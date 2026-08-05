import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useState, useCallback, type RefObject } from 'react';

/**
 * Hook para exportar un resumen visual de reportes a PDF.
 * Captura las páginas de un nodo raíz de forma asíncrona y genera un único archivo.
 */
export function useReportsPdfExport() {
    const [loading, setLoading] = useState(false);

    const generatePdf = useCallback(async ({ rootRef, fileName }: { rootRef: RefObject<HTMLElement | null>; fileName: string }) => {
        if (!rootRef.current) return;
        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 300));

            const pages = rootRef.current.querySelectorAll('[class*="pdf-page"]');
            if (!pages.length) return;

            const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 20;

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i] as HTMLElement;

                const canvas = await html2canvas(page, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    scrollX: 0,
                    scrollY: 0,
                    windowWidth: page.scrollWidth || 900,
                    windowHeight: page.scrollHeight || 1200,
                });

                const imgData = canvas.toDataURL('image/png');
                const maxWidth = pageWidth - margin * 2;
                const maxHeight = pageHeight - margin * 2;
                const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
                const imgWidth = canvas.width * scale;
                const imgHeight = canvas.height * scale;
                const x = (pageWidth - imgWidth) / 2;
                const y = margin;

                if (i > 0) pdf.addPage();

                pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            }

            pdf.save(fileName);
        } catch (err) {
            console.error('[useReportsPdfExport] Error generando PDF:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { generatePdf, loading };
}