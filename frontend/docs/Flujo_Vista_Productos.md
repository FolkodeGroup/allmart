# Vista de Productos – Documentación Técnica

## 1. Descripción General
La vista de productos es el núcleo del catálogo de la aplicación AllMart. Permite a los usuarios explorar, filtrar y visualizar productos disponibles, así como a los administradores gestionar el inventario, editar, crear y eliminar productos. Esta vista es fundamental tanto para la experiencia de compra pública como para la administración interna.

## 2. Estructura de Carpetas

```
frontend/src/
  features/
    products/
      ProductCard/
        ProductCard.tsx
    admin/
      products/
        AdminProducts.tsx
        AdminProductCard.tsx
        AdminProductForm.tsx
        BulkEditBar.tsx
        productsService.ts
  components/
    ui/
      ProductImage.tsx
      ProductPrice/ProductPrice.tsx
      Badge/Badge.tsx
      LoadingSpinner.tsx
      EmptyState.tsx
      ModalConfirm/ModalConfirm.tsx
      ProductHeader.tsx
      ProductFilters.tsx
      ProductCheckboxGeneral.tsx
      ProductFeedbackSection.tsx
      ProductCardsGrid.tsx
      ProductPagination.tsx
      ProductCardCheckbox.tsx
      ProductCardImage.tsx
      ProductCardInfo.tsx
      ProductCardPrice.tsx
      ProductCardMeta.tsx
      ProductCardActions.tsx
  context/
    AdminProductsContext.tsx
    AdminCategoriesContext.tsx
    AdminAuthContext.tsx
  services/
    productsService.ts
    categoriesService.ts
  pages/
    ProductList/ProductListPage.tsx
```

## 3. Componentes Principales

### ProductListPage
Archivo: pages/ProductList/ProductListPage.tsx

**Responsabilidad:**
Renderiza la vista pública del catálogo de productos, maneja filtros, ordenamiento y muestra la lista de productos.

**Props principales:**
No recibe props, maneja su propio estado y efectos.

**Relaciones:**
- Usa ProductCard para renderizar cada producto.
- Usa servicios fetchPublicProducts y fetchPublicCategories.

---

### ProductCard
Archivo: features/products/ProductCard/ProductCard.tsx

**Responsabilidad:**
Muestra la información de un producto individual en la vista pública, incluyendo imagen, nombre, precio, descuentos, stock y favoritos.

**Props principales:**
- product: Product & { stock?: number }

**Relaciones:**
- Usa ProductImage, Badge, ProductPrice, Button (componentes UI).

---

### AdminProducts
Archivo: features/admin/products/AdminProducts.tsx

**Responsabilidad:**
Vista principal de gestión de productos para administradores. Permite listar, buscar, filtrar, seleccionar, editar, eliminar y exportar productos.

**Props principales:**
No recibe props directos, usa hooks/contextos.

**Relaciones:**
- Usa AdminProductCard, AdminProductForm, BulkEditBar, ProductHeader, ProductFilters, ProductCheckboxGeneral, ProductFeedbackSection, ProductCardsGrid, ProductPagination, ModalConfirm, LoadingSpinner, EmptyState.
- Usa useAdminProducts, useAdminCategories, useAdminAuth (contextos).
- Usa productsService para operaciones CRUD.

---

### AdminProductCard
Archivo: features/admin/products/AdminProductCard.tsx

**Responsabilidad:**
Muestra la información de un producto en la vista de administración, con opciones de selección, edición y eliminación.

**Props principales:**
- id, name, sku, price, discount, stock, inStock, image, category, onEdit, onDelete, canEdit, canDelete, selected, onSelectChange, showCheckbox

**Relaciones:**
- Usa ProductCardCheckbox, ProductCardImage, ProductCardInfo, ProductCardPrice, ProductCardMeta, ProductCardActions, Badge (componentes UI).

---

### AdminProductForm
Archivo: features/admin/products/AdminProductForm.tsx

**Responsabilidad:**
Formulario para crear o editar productos en el panel de administración.

**Props principales:**
- productId?: string | null
- onClose: () => void

**Relaciones:**
- Usa useAdminProducts, useAdminCategories, useAdminImages (contextos).
- Usa ProductImage (UI).

---

### BulkEditBar
Archivo: features/admin/products/BulkEditBar.tsx

**Responsabilidad:**
Barra de acciones para edición masiva de productos seleccionados.

**Props principales:**
- selectedCount, onBulkEdit, onCancel, loading

**Relaciones:**
- Se muestra en AdminProducts cuando hay selección múltiple.

## 4. Flujo de Renderizado de la Vista

### Vista Pública
ProductListPage → (fetch productos/categorías) → [ProductCard, ...]

### Vista Admin
AdminProducts → (fetch productos/categorías vía contextos) → [BulkEditBar, ProductHeader, ProductFilters, ProductCardsGrid]
  → ProductCardsGrid → [AdminProductCard, ...]
  → AdminProductCard → [ProductCardCheckbox, ProductCardImage, ProductCardInfo, ...]
  → AdminProductForm (modal)

## 5. Flujo de Datos
- Los productos se obtienen desde el backend usando servicios (productsService.ts).
- En la vista pública, ProductListPage usa fetchPublicProducts y fetchPublicCategories.
- En la vista admin, AdminProducts usa el contexto AdminProductsContext, que centraliza el estado y operaciones CRUD.
- Los datos fluyen desde el contexto/servicio hacia los componentes de lista y luego a las tarjetas individuales.
- El estado global para admin se maneja con contextos personalizados (AdminProductsContext, AdminCategoriesContext, AdminAuthContext).

## 6. Componentes UI Reutilizables
- **ProductImage:** Renderiza imágenes de productos.
- **Badge:** Muestra etiquetas como "Nuevo", "Descuento", "Stock bajo".
- **ProductPrice:** Formatea y muestra el precio.
- **LoadingSpinner:** Indicador de carga.
- **EmptyState:** Estado vacío o de error.
- **ModalConfirm:** Modal de confirmación para acciones destructivas.
- **ProductHeader, ProductFilters, ProductCheckboxGeneral, ProductFeedbackSection, ProductCardsGrid, ProductPagination:** Utilidades para la gestión y visualización de productos.
- **ProductCardCheckbox, ProductCardImage, ProductCardInfo, ProductCardPrice, ProductCardMeta, ProductCardActions:** Subcomponentes atomizados para tarjetas de producto en admin.

## 7. Buenas Prácticas del Proyecto
- Separación clara entre lógica (servicios/contextos) y presentación (componentes UI).
- Uso extensivo de hooks y contextos para manejo de estado global y lógica de negocio.
- Modularización: componentes atomizados y reutilizables.
- Servicios centralizados para llamadas HTTP.
- Props tipadas y uso de TypeScript en todo el frontend.

## 8. Ejemplo de Uso

```tsx
// Ejemplo: Renderizar una tarjeta de producto en la vista pública
import { ProductCard } from 'features/products/ProductCard/ProductCard';

<ProductCard product={productoEjemplo} />

// Ejemplo: Renderizar la lista de productos en admin
import { AdminProducts } from 'features/admin/products/AdminProducts';

<AdminProducts />
```

## 9. Diagrama de Flujo Simplificado

```
VistaProductos
   ↓
Carga de datos (servicios/contextos)
   ↓
Lista de Productos (ProductCardsGrid/ProductListPage)
   ↓
Tarjeta de Producto (ProductCard/AdminProductCard)
   ↓
Componentes UI (Badge, ProductImage, etc)
```
