# Frontend de Allmart

Este frontend está construido con React, Vite y TypeScript.

## ✅ Checklist de Verificación

- [x] **Página de inicio** — Visualización correcta del home
(./src/assets/images/featured/home.png)
- [x] **Catálogo de productos** — Listado y filtrado de productos
(./src/assets/images/featured/catalogo.png)
- [x] **Categorías** — Navegación por categorías
(./src/assets/images/featured/categoria.png)
- [x] **Carrito de compras** — Agregar, actualizar y eliminar items
(./src/assets/images/featured/carrito-productos-agregados.png)
- [x] **Responsividad** — Funciona en mobile y desktop
(./src/assets/images/featured/responsividad.png)
- [x] **Imágenes** — Carga correcta de imágenes de productos
(./src/assets/images/featured/image.png)
- [x] **Favicon** — Muestra correctamente en la pestaña del navegador

- [x] **Autenticación** — Login y registro de usuarios (sin backend)

- [x] **Estilos** — Diseño coherente y funcionalidad CSS

### Evidencia visual
Aquí va la documentación de screenshots verificando cada punto del checklist anterior.

## Scripts

- `npm install` — Instala las dependencias
- `npm run dev` — Inicia el servidor de desarrollo (por defecto en el puerto 5173)
- `npm run build` — Genera la build de producción
- `npm run preview` — Previsualiza la build de producción

## Comunicación con el backend

El frontend se comunica con el backend mediante peticiones HTTP (por ejemplo, usando fetch o axios) a los endpoints definidos en `/backend` (por defecto en http://localhost:3001).

## Requisitos
- Node.js >= 18

## Estructura
- `/src` — Código fuente del frontend
- `/public` — Archivos estáticos
- `/src/assets/images/categories/` imagenes de las categorias, ejemplo: cocina, baño, etc. 
- `/src/assets/images/featured/` imagenes de productos destacados.
- `/src/assets/images/products/` imagenes de productos.

## Añadir nuevas imágenes

Las imágenes se guardan en `src/assets/images` dentro de subcarpetas específicas según su uso:
- `categories/` – imágenes de categorías (ej. `cocina.jpg`, `baño.png`).
- `featured/` – imágenes de productos destacados (ej. `destacados-1.jpg`).
- `products/` – imágenes de productos; dentro hay carpetas por categoría y luego por producto:
  ```
  src/assets/images/products/electrodomésticos/aspiradora.jpg
  src/assets/images/products/cocina/licuadora.png
  ```
  
**Proceso de incorporación:**
1. Descargar o crear la imagen asegurando buena resolución y formato `.jpg` o `.png`.
2. Renombrar el archivo con un nombre claro y sin espacios (usar guiones `-`).
3. Colocar el archivo en la carpeta correspondiente. Para productos nuevos:
   - Crear la subcarpeta de la categoría si no existe (`src/assets/images/products/<categoria>/`).
   - Si es un producto específico, puede agregarse directamente con su nombre.

**Ejemplos de nombres y estructura:**

```
/src/assets/images/logos/logo1.jpg
/src/assets/images/logos/logo2.png

/src/assets/images/featured/destacado-1.jpg
/src/assets/images/featured/destacado-2.png

/src/assets/images/products/cocina/olla-honda.jpg
/src/assets/images/products/baño/jabon-líquido.png
```

4. Hacer commit de los nuevos archivos en git para que se incluyan en el repositorio.
5. Si el producto está en la base de datos, actualizar los datos en el backend (o mock) para referenciar la nueva imagen con la ruta relativa a `/assets/images/...`.

Con esto se asegura que el frontend pueda cargar las imágenes correctamente.

Para más detalles sobre la arquitectura y la comunicación, consulta el archivo ARCHITECTURE.md en la raíz del proyecto.
