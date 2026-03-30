import { useRef } from 'react';
import { PrintableReport } from './PrintableReport';
import { createPortal } from 'react-dom';
import type { PrintableReportProps } from './PrintableReport';

/**
 * Hook para preparar el renderizado offscreen de PrintableReport en un div oculto.
 * El usuario debe colocar <div ref={containerRef} style={{display:'none'}} /> en el DOM.
 * Devuelve el nodo ref y el portal React para renderizar el contenido.
 */
export function usePrintableReportRender(props: PrintableReportProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    // No accedemos a containerRef.current durante render
    // El portal debe ser creado fuera del render, por ejemplo en un efecto o función controlada
    const getPortal = () => {
        if (containerRef.current instanceof Element) {
            return createPortal(<PrintableReport {...props} ref={containerRef} />, containerRef.current);
        }
        return null;
    };
    return { containerRef, getPortal };
}
