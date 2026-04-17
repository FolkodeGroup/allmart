# Arquitectura del Proyecto Allmart

Este proyecto está dividido en dos partes principales:

## Frontend
- Ubicación: `/frontend`
- Stack: React + Vite
- Encargado de la interfaz de usuario y la experiencia del cliente.
- Comunicación con el backend vía HTTP (API REST).

## Backend
- Ubicación: `/backend`
- Stack: Node.js + Express (base mínima, puedes extenderla)
- Encargado de la lógica de negocio, persistencia de datos y API.

## Comunicación y Seguridad
- El frontend realiza peticiones HTTP al backend mediante un cliente centralizado (`apiClient.ts`).
- **Autenticación**: Se utiliza JWT (JSON Web Tokens). El token se almacena en el `localStorage` y se envía en el header `Authorization: Bearer <token>` en cada petición administrativa.
- **Manejo de Errores**: Si el backend responde con un error 401 (No autorizado), el frontend captura el evento y cierra la sesión automáticamente para proteger la integridad de los datos.

## Gestión de Entidades (Admin)
La administración de la tienda se divide en servicios especializados:
- **`productsService.ts`**: Gestión de productos con soporte para paginación y filtros.
- **`categoriesService.ts`**: Organización jerárquica de productos.
- **`variantsService.ts`**: Gestión de variaciones (talle, color, stock) para cada producto.
- **`productImagesService.ts`**: Subida de archivos binarios y gestión de galería (WebP + Miniaturas).

## Flujo de Datos Real
1. El usuario interactúa con la app en el frontend.
2. El `apiClient` intercepta la petición, añade el token JWT y realiza el `fetch`.
3. El backend valida el token, procesa la lógica de negocio y responde con datos JSON o binarios.
4. El frontend actualiza el estado global (Context API) y la UI de forma reactiva.

## Extensión
El sistema está diseñado para ser extensible. Puedes agregar nuevos servicios siguiendo el patrón de `apiClient` para asegurar que la autenticación se maneje de forma transparente.
