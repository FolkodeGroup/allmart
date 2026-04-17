# 📚 Documentación: Gestión de Categorías (Admin)

## 📌 1. Visión General
Esta sección detalla la arquitectura, el flujo de datos y la composición de la vista de administración de categorías en AllMart. El objetivo principal es permitir a los administradores gestionar el catálogo jerárquico de productos de manera eficiente.

### 🎯 Objetivos Clave
- Facilitar el **onboarding** de nuevos desarrolladores.
- Estandarizar el **mantenimiento** del código.
- Documentar los **flujos de negocio** (CRUD, edición masiva, visibilidad).

---

## 🏗️ 2. Arquitectura de la Vista

La vista se basa en el patrón **Container/Presenter** mediado por **Hooks** y **Context API**.

### 📍 Componente Principal: `AdminCategories`
**Ubicación:** `features/admin/categories/AdminCategories.tsx`

Es el orquestador de la vista. Se encarga de conectar los contextos y renderizar la estructura base: header, filtros, grilla y paginación.

### 🧱 Desglose de Componentes

| Componente | Responsabilidad |
| :--- | :--- |
| `CategoriesHeader` | Título de la sección y botón de acción "Nueva Categoría". |
| `CategoriesFilters` | Input de búsqueda con debounce y contadores globales. |
| `CategoriesGrid` | Renderizado de la lista/tabla de categorías y acciones rápidas. |
| `CategoriesPagination` | Controles de navegación entre páginas de resultados. |
| `BulkEditCategoriesBar` | Barra flotante que aparece al seleccionar múltiples elementos. |
| `UI Reutilizable` | `Modal`, `LoadingSpinner`, `EmptyState` (Componentes transversales). |

---

## 🪝 3. Lógica y Estado

### Hooks Personalizados
- **`useAdminCategories`**: Centraliza el acceso al `AdminCategoriesContext`.
- **`useCategorySelection`**: Gestiona el estado de los checkboxes (selección individual y "seleccionar todo").
- **`useCategoryBulkEdit`**: Controla el estado del modal y la ejecución de cambios masivos.

### Contextos Utilizados
1. **`AdminCategoriesContext`**: Estado global de las categorías (datos, loading, paginación).
2. **`AdminAuthContext`**: Verificación de permisos (RBAC) para acciones como eliminar o editar.
3. **`NotificationContext`**: Feedback visual mediante toasts (éxito/error).

---

## 📡 4. Capa de Datos (Servicios)

- **`categoriesService.ts`**: Comunicación con los endpoints de `/api/admin/categories`. Incluye mapeo de tipos de backend a frontend.
- **`productsService.ts`**: Utilizado ocasionalmente para obtener conteos de productos vinculados.

---

## 🔄 5. Flujos de Interacción Clave

### A. Carga y Filtrado
1. El usuario ingresa a la vista.
2. `AdminCategories` dispara `refreshCategories`.
3. Se aplica el término de búsqueda (si existe) con un **debounce** de 300ms.
4. Los resultados actualizan el estado global y se reflejan en el `CategoriesGrid`.

### B. Edición Masiva
1. El usuario selecciona varios ítems en el `CategoriesGrid`.
2. Aparece `BulkEditCategoriesBar`.
3. Al hacer clic en "Editar", se abre un modal gestionado por `useCategoryBulkEdit`.
4. Se confirman los cambios y se refresca la lista.

### C. Cambio de Visibilidad (Optimista)
1. El usuario alterna el switch de visibilidad.
2. Se muestra un modal de confirmación.
3. Se realiza la llamada al servicio; si falla, se revierte el estado local para mantener la consistencia.

---

## 🗂️ 6. Estructura de Archivos

```text
features/admin/categories/
├── components/
│   ├── CategoriesHeader.tsx
│   ├── CategoriesFilters.tsx
│   ├── CategoriesPagination.tsx
│   └── CategoriesGrid.tsx
├── hooks/
│   ├── useCategorySelection.ts
│   └── useCategoryBulkEdit.ts
├── AdminCategories.tsx
├── BulkEditCategoriesBar.tsx
└── categoriesService.ts
```

---

## 🛠️ 7. Buenas Prácticas y Recomendaciones

1. **Separación de Concernas**: Mantener la lógica de validación de formularios y llamadas API fuera de los componentes de React (usar hooks/servicios).
2. **Manejo de Estados**: Utilizar siempre los estados `loading` y `error` provistos por el contexto para evitar interfaces "congeladas".
3. **Seguridad**: Verificar el rol del usuario desde `AdminAuthContext` antes de renderizar botones de acciones sensibles (Delete/Edit).
4. **Performance**: El `CategoriesGrid` debe estar optimizado para no re-renderizar todas las filas si solo cambia una selección (usar `React.memo` si es necesario).

---

## 🚦 Estados y Casos de Borde

- **Sin resultados**: Mostrar `EmptyState` con opción de limpiar filtros.
- **Error de red**: Mostrar mensaje de error y botón de reintento.
- **Carga inicial**: Mostrar `LoadingSpinner` ocupando el espacio del grid.