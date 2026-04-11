# ADMIN UX REDESIGN PROPOSAL

Fecha: 2026-04-06
Scope: Panel Admin Ecommerce (frontend)

## 1) Contexto y problema

El panel actual esta organizado por modulos tecnicos (Productos, Imagenes, Variantes) en vez de por tareas reales.
Resultado: para completar una sola tarea de negocio (crear o editar producto) el usuario salta entre vistas y pierde continuidad.

### Evidencia en el codigo actual

- Navegacion separada por modulo:
  - `src/pages/Admin/AdminLayout.tsx` (items de nav con `Imagenes` y `Variantes` como secciones de primer nivel)
- Rutas separadas por recurso:
  - `src/App.tsx` (`/admin/productos`, `/admin/imagenes`, `/admin/variantes`)
- Form de producto parcialmente integrado, pero con desvio mental:
  - `src/features/admin/products/AdminProductForm.tsx`
  - El copy invita a ir a otra seccion para gestionar variantes en detalle.
- Dashboard con sobrecarga visual/informativa:
  - `src/pages/Admin/AdminDashboard.tsx`

## 2) Objetivo UX

1. Gestionar TODO lo de un producto desde una unica vista de trabajo.
2. Reducir friccion del alta de nuevo producto (menos campos visibles al inicio, mejor guiado, defaults inteligentes).
3. Transformar dashboard en centro de decisiones accionables, no en una mezcla de widgets.

## 3) Nueva arquitectura de informacion (IA)

### Sidebar propuesta

1. Dashboard
2. Catalogo
3. Pedidos
4. Marketing
5. Reportes

### Reglas de IA

- `Imagenes` y `Variantes` dejan de existir como entradas de primer nivel.
- Pasan a sub-secciones internas de `Catalogo > Producto`.
- Se preservan rutas legacy con redirect suave para no romper bookmarks.

## 4) Vista objetivo: "Producto 360"

Una sola pantalla tipo master-detail:

- Columna izquierda: listado de productos + filtros + quick actions.
- Panel derecho: detalle del producto seleccionado con tabs.

### Tabs del detalle

1. Basico
2. Precios e inventario
3. Variantes
4. Imagenes
5. SEO y publicacion

### Beneficio

Evita cambio de contexto. El usuario no "navega para terminar", edita y publica desde un mismo lugar.

## 5) Flujo de "Nuevo producto" (simplificado)

### Opcion A (recomendada): wizard en 3 pasos

1. Basico
2. Variantes e imagenes
3. Review y publicar

### Opcion B: formulario unico progresivo

- Mostrar solo campos criticos al inicio.
- Desplegar secciones avanzadas de forma progresiva.

### Mejoras UX obligatorias

- Auto-generar `slug` desde nombre (editable).
- SKU sugerido automaticamente con opcion de override.
- Defaults de categoria, stock, visibilidad y moneda.
- Atajos para duplicar producto existente como plantilla.
- Validacion por campo en tiempo real (sin esperar submit final).

## 6) Dashboard redisenado

### Estado actual

Demasiados bloques compiten entre si (bienvenida, acceso rapido, widgets drag-and-drop, charts, status tecnico).

### Estado objetivo

Dashboard orientado a accion diaria:

1. Pedidos pendientes de accion
2. Stock critico
3. Productos con publicacion incompleta
4. Alertas de pago/envio

Luego, un bloque de "Actividad reciente" y un acceso a "Analitica avanzada".

### Regla clave

Si un dato no dispara accion, no va en primer pliegue del dashboard.

## 7) Mapa de implementacion por archivos

## 7.1 Navegacion y rutas

- `src/pages/Admin/AdminLayout.tsx`
  - Quitar `Imagenes` y `Variantes` del nav principal.
- `src/App.tsx`
  - Mantener rutas legacy y redirigir:
    - `/admin/imagenes` -> `/admin/productos?tab=imagenes`
    - `/admin/variantes` -> `/admin/productos?tab=variantes`

## 7.2 Catalogo / producto

- `src/features/admin/products/AdminProducts.tsx`
  - Evolucionar a layout master-detail en vez de lista + modal aislado.
- `src/features/admin/products/AdminProductForm.tsx`
  - Integrar tabs reales de gestion en una jerarquia clara.
  - Eliminar copy que empuja a otra seccion para variantes.

## 7.3 Dashboard

- `src/pages/Admin/AdminDashboard.tsx`
  - Reducir complejidad visual.
  - Priorizar KPIs accionables y alerts.

## 8) Roadmap recomendado

### Fase 1 (quick wins, bajo riesgo)

1. Ajustar IA (nav + redirects legacy).
2. Ajustar copy/labels del formulario para flujo unificado.
3. Limpiar dashboard (menos bloques, mayor jerarquia).

### Fase 2 (valor alto)

1. Implementar vista master-detail de producto.
2. Integrar variantes + imagenes en tabs de detalle.
3. Atajos de productividad (duplicar, defaults, autocompletado).

### Fase 3 (optimizar alta de producto)

1. Wizard de nuevo producto.
2. Plantillas por categoria.
3. Chequeo de "ready to publish" con checklist visible.

## 9) Criterios de exito

1. Tiempo de alta de producto nuevo: -30%.
2. Clicks para completar producto (con imagenes y variantes): -40%.
3. Menos abandono de formulario (dropoff).
4. Menor uso de rutas separadas de imagenes/variantes.

## 10) Siguiente paso sugerido

Implementar Fase 1 en codigo (sin romper backend) y validar con una demo interna.
