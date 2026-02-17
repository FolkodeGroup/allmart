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

## Comunicación
- El frontend realiza peticiones HTTP al backend (por ejemplo, usando fetch o axios).
- El backend expone endpoints REST en el puerto 3001 (por defecto).
- Puedes configurar CORS en el backend si es necesario.

## Ejemplo de flujo
1. El usuario interactúa con la app en el frontend.
2. El frontend solicita datos al backend (por ejemplo, productos).
3. El backend responde con los datos solicitados.

## Extensión
Puedes agregar autenticación, base de datos, rutas adicionales, etc., según las necesidades del proyecto.
