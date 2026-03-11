# Guía de Gestión de Entidades (Allmart)

Esta guía detalla cómo se gestionan las entidades principales (Productos, Categorías, Variantes e Imágenes) en el sistema Allmart, incluyendo ejemplos de uso técnico y buenas prácticas.

---

## 1. Gestión de Productos (`productsService.ts`)

Los productos son la base del catálogo. Cada producto puede tener múltiples variantes e imágenes.

### API Real (Ejemplos)
Para obtener productos administrativos con paginación:
```typescript
import { fetchAdminProducts } from './services/productsService';

const products = await fetchAdminProducts(token, { page: 1, limit: 10 });
console.log(products.data); // Lista de productos (con ID, nombre, slugs, etc.)
```

---

## 2. Gestión de Categorías (`categoriesService.ts`)

Las categorías permiten organizar el catálogo. Cada categoría tiene un `slug` único para SEO.

### Ejemplo de Creación:
```typescript
import { createAdminCategory } from './services/categoriesService';

const newCategory = await createAdminCategory(token, {
  name: "Electrónica",
  slug: "electronica",
  description: "Gadgets y más"
});
```

---

## 3. Gestión de Variantes (`productVariantsService.ts`)

Cada producto puede tener diferentes presentaciones (ej. Talle L, Color Rojo). Se gestionan por separado para controlar el stock individual.

### Ejemplo de Actualización de Stock:
```typescript
import { updateAdminVariant } from './services/productVariantsService';

await updateAdminVariant(token, productId, variantId, {
  stock: 50,
  price: 1500.00
});
```

---

## 4. Gestión de Imágenes (`productImagesService.ts`)

El sistema soporta subida de archivos binarios. La API convierte las imágenes a formato **WebP** y genera miniaturas automáticamente para optimizar la carga.

### Ejemplo de Subida:
```typescript
import { uploadProductImage } from './services/productImagesService';

const file = input.files[0];
const newImage = await uploadProductImage(token, productId, file, "Descripción Alt");
console.log(newImage.url); // URL generada por el backend (/api/images/products/...)
```

---

## 5. Buenas Prácticas

### 🛡️ Seguridad
- **Nunca** almacenes el token JWT en el código fuente. El sistema lo gestiona en `localStorage` a través de los contextos de React.
- **Siempre** usa el `apiClient` para realizar peticiones; este añade automáticamente los headers necesarios.

### 🚀 Rendimiento
- **Imágenes**: Prefiere la subida de archivos binarios sobre URLs externas. El backend optimiza el peso y formato.
- **Validaciones**: Siempre valida los datos en el frontend antes de enviarlos (ya implementado en los formularios de edición).

### 📝 Mantenimiento
- Si necesitas agregar un nuevo endpoint, agrégalo al servicio correspondiente y asegúrate de añadir el tipo de respuesta esperado para mantener la seguridad de tipos (TypeScript).
- Mantén actualizados los tests en `src/services/__tests__/` al realizar cambios en la estructura de los datos.

---

*Documentación actualizada al 11 de marzo de 2026.*
