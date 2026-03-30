# Módulo de Reportes (AdminReports)

## Descripción General

El módulo de reportes permite visualizar, filtrar y exportar información clave sobre las órdenes y el rendimiento de la tienda. Incluye KPIs, gráficos, filtros avanzados y una tabla de pedidos, todo integrado en una vista centralizada para administración.

---

## Arquitectura y Organización

```
features/
  admin/
    reports/
      AdminReports.tsx         // Componente principal
      AdminReports.module.css  // Estilos del módulo
      components/
        ReportsFilters.tsx     // Filtros avanzados
        ReportsMetrics.tsx     // KPIs
        BarChart.tsx           // Gráfico de barras (lazy)
        DonutChart.tsx         // Gráfico de torta (lazy)
        OrdersTable.tsx        // Tabla de pedidos
        Pagination.tsx         // Paginación
        DatosMockeados.ts      // Mock de datos
```

- **AdminReports.tsx**: Orquesta el flujo de datos, renderiza filtros, métricas, gráficos y tabla.
- **components/**: Componentes atómicos y de presentación.
- **hooks/**: Hooks reutilizables (ej: `useUnsavedChangesWarning`).

---

## Flujo General de Datos

1. **Carga de datos**: (mock o contexto real)
2. **Filtrado**: `ReportsFilters` actualiza el estado de filtros en `AdminReports`.
3. **KPIs**: `ReportsMetrics` recibe datos filtrados y calcula métricas.
4. **Gráficos**: `BarChart` y `DonutChart` muestran visualizaciones basadas en los datos filtrados.
5. **Tabla**: `OrdersTable` muestra los pedidos filtrados y paginados.
6. **Exportación**: Permite exportar los datos visibles en CSV, Excel o PDF.

---

## Componentes Clave

### 1. AdminReports

Responsabilidad: Componente principal. Maneja estado global de filtros, datos, paginación y renderiza la vista completa.

```tsx
/**
 * Vista principal de reportes administrativos.
 * - Orquesta filtros, métricas, gráficos y tabla de pedidos.
 * - Maneja estado de filtros, paginación y exportación.
 */
export function AdminReports() { ... }
```

Props: Ninguna (usa datos internos o contexto).

---

### 2. ReportsFilters

Responsabilidad: Permite seleccionar periodo, rango de fechas y aplicar filtros avanzados (estado, cliente, producto).

Props principales:
- `value`: Estado actual de los filtros
- `onChange`: Callback para actualizar filtros
- `minDate`, `maxDate`: Límites de fechas

Ejemplo de uso:
```tsx
<ReportsFilters
  value={filters}
  onChange={setFilters}
  minDate={minDate}
  maxDate={maxDate}
/>
```

---

### 3. ReportsMetrics

Responsabilidad: Calcula y muestra KPIs (ingresos, cantidad de pedidos, ticket promedio, etc.)

Props principales:
- `orders`: Array de pedidos filtrados

Ejemplo:
```tsx
<ReportsMetrics orders={periodOrders} />
```

---

### 4. BarChart / DonutChart

Responsabilidad: Visualización de datos (ventas por día, distribución por estado, etc.)

- **Lazy loading**: Se cargan bajo demanda para optimizar performance.

Props: Dependen del gráfico (ver archivo correspondiente).

Ejemplo:
```tsx
const BarChart = lazy(() => import('./BarChart'));
...
<Suspense fallback={<div>Cargando...</div>}>
  <BarChart data={chartData} />
</Suspense>
```

---

### 5. OrdersTable

Responsabilidad: Muestra la lista de pedidos filtrados y paginados.

Props principales:
- `orders`: Array de pedidos a mostrar

Ejemplo:
```tsx
<OrdersTable orders={paginatedOrders} />
```

---

### 6. Pagination

Responsabilidad: Controla la paginación de la tabla de pedidos.

Props principales:
- `page`: Página actual
- `pageSize`: Tamaño de página
- `total`: Total de elementos
- `onPageChange`: Cambia de página

Ejemplo:
```tsx
<Pagination
  page={page}
  pageSize={pageSize}
  total={filteredOrders.length}
  onPageChange={setPage}
/>
```

---

## Hooks Relevantes

### useUnsavedChangesWarning

Responsabilidad: Detecta cambios no guardados y bloquea navegación accidental.

Retorna:
- `isDirty`: Si hay cambios pendientes
- `setIsDirty`: Marcar/cancelar cambios
- `showWarning`: Si debe mostrar modal de confirmación
- `confirmNavigation`, `cancelNavigation`: Acciones del modal

Ejemplo de uso:
```tsx
const { setIsDirty, showWarning, confirmNavigation, cancelNavigation } = useUnsavedChangesWarning({ active: true });
```

---

## Flujos Importantes

### 1. Filtrado de datos
- El usuario ajusta filtros en `ReportsFilters`.
- Se actualiza el estado `filters` en `AdminReports`.
- Se recalculan los datos filtrados (`periodOrders`).

### 2. Cálculo de KPIs
- `ReportsMetrics` recibe los pedidos filtrados y calcula métricas clave usando `useMemo` para performance.

### 3. Renderizado de gráficos
- Los datos filtrados se pasan a los gráficos (`BarChart`, `DonutChart`).
- Los componentes se cargan de forma lazy para optimizar el bundle.

### 4. Exportación de datos
- El usuario selecciona formato y confirma exportación.
- Se genera y descarga el archivo con los pedidos filtrados.

---

## Buenas Prácticas del Módulo

- **useMemo**: Optimiza cálculos de KPIs y filtrado para evitar renders innecesarios.
- **Lazy loading**: Gráficos se cargan bajo demanda.
- **Separación de responsabilidades**: Cada componente tiene una función clara.
- **Manejo de estado**: Estado global en `AdminReports`, estado local en componentes.
- **Documentación y tipado**: Uso de TypeScript y JSDoc para claridad y mantenibilidad.

---

## Ejemplo de flujo completo

```tsx
// En AdminReports.tsx
const [filters, setFilters] = useState<ReportsFiltersValue>({ type: 'predefined', period: '30d' });
const periodOrders = useMemo(() => filtrarPedidos(orders, filters), [orders, filters]);

<ReportsFilters value={filters} onChange={setFilters} ... />
<ReportsMetrics orders={periodOrders} />
<Suspense fallback={<div>Cargando...</div>}>
  <BarChart data={periodOrders} />
</Suspense>
<OrdersTable orders={paginatedOrders} />
<Pagination ... />
```

---

## Mantenimiento y Extensión

- Para agregar nuevos filtros, extender `ReportsFilters` y el estado en `AdminReports`.
- Para nuevos KPIs, modificar `ReportsMetrics`.
- Para nuevos gráficos, crear componente y agregar lazy import en `AdminReports`.
- Mantener la separación de lógica y presentación.

---

## Créditos y Contacto

Desarrollado por el equipo FolkodeGroup. Para dudas o mejoras, contactar al equipo de frontend.
