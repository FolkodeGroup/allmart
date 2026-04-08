# 📦 Documentación Técnica Formal - Vista de Pedidos (AdminOrders)

## 1. Objetivo

El presente documento tiene como finalidad describir en detalle la arquitectura, funcionamiento, flujos, componentes y manejo de datos de la vista de pedidos del módulo administrativo.

Está orientado a:

* Facilitar el onboarding de nuevos desarrolladores.
* Servir como referencia técnica para mantenimiento y evolución.
* Documentar buenas prácticas y decisiones de implementación.

---

## 2. Alcance

La documentación cubre:

* Componentes de la vista de pedidos.
* Flujo de datos y estados.
* Casos de uso funcionales.
* Integración con servicios.
* Estrategias de UI/UX y optimización.

---

## 3. Descripción General del Módulo

La vista `AdminOrders` es el punto central de gestión de pedidos dentro del panel administrativo.

Permite:

* Visualización de pedidos en formato tabla y lista responsive.
* Aplicación de filtros avanzados.
* Ejecución de acciones individuales y masivas.
* Exportación de datos.
* Visualización detallada del pedido.

Tecnologías utilizadas:

* React (Hooks)
* Context API
* CSS Modules
* Servicios asincrónicos (API REST)

---

## 4. Arquitectura

### 4.1 Componente principal

* `AdminOrders`

  * Orquesta el estado global de la vista.
  * Gestiona fetch, paginación, selección y modales.

### 4.2 Componentes secundarios

* `OrdersHeader` → Encabezado
* `OrdersFiltersBar` → Filtros
* `OrdersTable` → Vista desktop
* `OrderList` → Vista mobile
* `OrderItem` → Representación individual
* `OrderDetailModal` → Detalle del pedido
* `ModalConfirm` → Confirmaciones
* `Notification` → Feedback

### 4.3 Hooks personalizados

* `useOrdersFilters`

  * Encapsula lógica de filtrado
  * Devuelve `filters`, `filtered`, `reset`

* `useReportsExport`

  * Maneja exportación
  * Controla estado de descarga y notificaciones

* `useUnsavedChanges`

  * Control global de cambios no persistidos

---

## 5. Modelo de Datos

### 5.1 Entidad Order

```ts
Order {
  id: string
  createdAt: string
  customer: {
    firstName: string
    lastName: string
    email: string
  }
  items: Item[]
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paidAt?: string
  notes?: string
  statusHistory: OrderHistoryEntry[]
}
```

### 5.2 Estados relevantes

* `orders`: fuente de verdad
* `filtered`: subconjunto filtrado
* `selectedIds`: selección múltiple
* `page`: paginación
* `filters`: estado de filtros

---

## 6. Flujo de Datos

### 6.1 Inicialización

1. Montaje del componente
2. Inicialización con datos mock o API
3. Configuración de estados

### 6.2 Fetch de datos

```text
UI → fetchOrders → API → mapApiOrderToOrder → setOrders
```

Características:

* Uso de AbortController
* Normalización de datos
* Manejo de errores con feedback visual

---

## 7. Sistema de Filtros

Implementado mediante `useOrdersFilters`.

### Funcionalidades

* Filtrado por estado
* Filtrado por rango de fechas
* Reset de filtros
* Detección de filtros activos

### Optimización

* Debounce de 400ms para evitar renders innecesarios

---

## 8. Paginación

### Implementación

* Estado `page`
* Constante `PAGE_SIZE`

### Flujo

1. Cambio de página
2. Ejecución de fetch
3. Concatenación de resultados

---

## 9. Selección Múltiple

Permite operar sobre múltiples pedidos simultáneamente.

### Acciones

* Seleccionar individualmente
* Limpiar selección

### Uso

Base para acciones masivas

---

## 10. Acciones Masivas

### Tipos

* Confirmar pedidos
* Marcar como enviados
* Cancelar pedidos

### Validación

Se utiliza una función de compatibilidad que valida:

* Estados actuales
* Reglas de negocio

### Flujo

1. Selección de pedidos
2. Elección de acción
3. Confirmación en modal
4. Ejecución

---

## 11. Exportación de Datos

Gestionada por `useReportsExport`.

### Formatos soportados

* CSV
* Excel
* PDF

### Flujo

1. Selección de formato
2. Validación de datos
3. Confirmación
4. Generación de archivo

---

## 12. Manejo de Estado Optimista

Implementado en `OrderItem`.

### Flujo

1. Usuario modifica estado
2. Actualización inmediata en UI
3. Llamada a API
4. Rollback en caso de error

Beneficio:

* Mejora percepción de rendimiento

---

## 13. Casos de Uso

### 13.1 Visualizar pedidos

* Acceso a la vista
* Render inicial

### 13.2 Filtrar pedidos

* Aplicación de filtros
* Actualización de resultados

### 13.3 Actualizar estado

* Cambio de estado
* Persistencia

### 13.4 Ejecutar acciones masivas

* Selección múltiple
* Confirmación
* Ejecución

### 13.5 Exportar información

* Selección de formato
* Descarga

### 13.6 Ver detalle

* Selección de pedido
* Apertura de modal

---

## 14. Buenas Prácticas Implementadas

* Separación de responsabilidades
* Uso de hooks personalizados
* Optimización con useMemo/useCallback
* Manejo de errores centralizado
* Accesibilidad (ARIA, navegación por teclado)

---

## 15. Consideraciones Técnicas

* Evitar renders innecesarios
* Control de estados de carga
* Validación de acciones
* Consistencia en enums

---

## 16. Recomendaciones de Mejora

* Implementar virtualización de listas
* Incorporar caching (React Query / SWR)
* Agregar testing unitario
* Mejorar manejo de errores en API

---

## 17. Conclusión

La vista de pedidos se encuentra diseñada bajo principios de modularidad, escalabilidad y mantenibilidad.

Su estructura permite:

* Extensión funcional sencilla
* Reutilización de componentes
* Integración eficiente con backend

Este documento debe mantenerse actualizado ante cualquier cambio estructural o funcional relevante.
