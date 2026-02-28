# Allmart

Este proyecto está dividido en dos partes principales:

- **frontend/**: Aplicación cliente (React + Vite)
- **backend/**: API y lógica de negocio (Node.js + Express)

## Instrucciones rápidas

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## Documentación

- Consulta `frontend/README.md` y `backend/README.md` para instrucciones específicas de cada parte.
- Consulta `ARCHITECTURE.md` para detalles sobre la arquitectura y la comunicación entre frontend y backend.

## Calidad de Código y Git Hooks

Este proyecto utiliza **Husky** y **lint-staged** para garantizar que no se realicen commits con errores de TypeScript.

- **Pre-commit Hook**: Antes de cada commit, se ejecutarán automáticamente las comprobaciones de tipos (`tsc --noEmit`) en las carpetas `backend/` y `frontend/` si se han modificado archivos en las mismas.
- Si hay errores, el commit será abortado y deberás corregirlos antes de intentar de nuevo.
- Para ejecutar manualmente las comprobaciones de tipos desde la raíz:
  ```bash
  npm run check-types
  ```

---

Proyecto creado por FolKode Group.
