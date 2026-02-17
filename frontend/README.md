# Frontend de Allmart

Este frontend está construido con React, Vite y TypeScript.

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

Para más detalles sobre la arquitectura y la comunicación, consulta el archivo ARCHITECTURE.md en la raíz del proyecto.
