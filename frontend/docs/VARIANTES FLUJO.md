
---

#  Documentación Técnica: Variantes de Producto (ProductDetailPage)

## 1. Descripción del Módulo
Este componente gestiona la visualización detallada de un producto y la selección de sus variantes (talles, colores, etc.). La lógica de variantes es **restrictiva**: el usuario no puede agregar el producto al carrito sin haber seleccionado una opción para cada grupo disponible.

## 2. Flujo de Datos y Estado

| Estado | Tipo | Descripción |
| :--- | :--- | :--- |
| `selectedVariants` | `Record<string, string>` | Objeto que almacena el par `{ groupId: value }`. |
| `variantGroups` | `VariantGroup[]` | Lista de grupos (ej: "Talles") con sus valores (ej: ["S", "M"]). |

### Lógica de Validación
El botón de "Agregar al carrito" utiliza una validación dinámica:
```typescript
// El botón se deshabilita si faltan variantes por seleccionar
disabled={
  variantGroups.length > 0 && variantGroups.some(g => !selectedVariants[g.id])
}
```

---

## 3. Guía de Accesibilidad (WCAG Compliance)
Este componente fue diseñado siguiendo estándares de accesibilidad para asegurar que todo el equipo y los usuarios (incluyendo aquellos con tecnologías asistivas) puedan operar la vista.

* **Interacción por Teclado:** Se implementó `onKeyDown` en las imágenes miniatura y botones de variantes para soportar las teclas `Enter` y `Espacio`.
* **Roles ARIA:**
    * Las miniaturas usan `role="tablist"` para indicar un grupo de elementos relacionados.
    * Los botones de variantes usan `aria-pressed` para comunicar a los lectores de pantalla cuál opción está seleccionada.
* **Etiquetado:** Todos los controles de cantidad y botones tienen `aria-label` descriptivos.

---

## 4. Estructura de Componentes en el Repositorio

Si necesitás realizar mantenimiento, estos son los archivos implicados:

* **Vista Principal:** `src/pages/ProductDetail/ProductDetailPage.tsx`
* **Estilos:** `src/pages/ProductDetail/ProductDetailPage.module.css`
* **Servicios:** `src/services/productsService.ts` (Maneja el fetching de los datos).
* **Contexto:** `src/context/AdminProductsContext` (Define el tipo `VariantGroup`).

---

## 5. Ejemplo de Onboarding para el Equipo
**¿Cómo agregar un nuevo grupo de variantes?**
1.  Asegurarse de que el backend devuelva el array de `variants` dentro del objeto `product`.
2.  El componente `ProductDetailPage` automáticamente mapeará los grupos y renderizará los botones.
3.  La validación del carrito se actualizará sola para exigir la selección de este nuevo grupo.

---

### ¿Qué sigue ahora?
Para que esta documentación sea perfecta, me faltaría ver el **modelo de Prisma** (`backend/prisma/schema.prisma`). Con eso puedo agregar una sección de **"Estructura de Base de Datos"** indicando cómo se guardan estas variantes.

