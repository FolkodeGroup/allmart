# Estilo de exportación PDF para reportes

Los PDFs de resumen de reportes se generan con un estilo orientado a impresión para mejorar legibilidad en papel.

## Principios aplicados
- Tipografía legible y consistente en tamaño medio para texto y tablas.
- Espaciado amplio entre secciones, encabezados y bloques de contenido.
- Encabezados con título, fecha, período y numeración de páginas.
- Tablas con bordes claros, alineación numérica y badges de estado/pago con ancho estable.
- Diseño compatible con formato A4/Letter y márgenes amplios para lectura.

## Implementación
- El componente de exportación visual vive en src/features/admin/reports/PrintableReport.tsx.
- El render de tablas se adapta al modo de impresión desde src/features/admin/reports/components/OrdersTable.tsx.
- El hook de generación PDF se encuentra en src/features/admin/reports/useReportsPdfExport.ts.
