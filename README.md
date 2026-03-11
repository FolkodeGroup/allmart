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

## 🐳 Docker (levantar todo con un solo comando)

Si tenés Docker instalado, podés levantar todo el proyecto (backend + frontend + base de datos) sin instalar nada más:

```bash
# 1. Copiar las variables de entorno
cp .env.docker.example .env        # Linux/Mac
copy .env.docker.example .env      # Windows CMD

# 2. Levantar todo
docker compose up --build

# 3. Abrir en el navegador: http://localhost:8080
```

> 📖 **Guía completa con instrucciones detalladas para Windows, Linux y Mac:** consulta [DOCKER.md](DOCKER.md)

## Documentación

- [Estructura del Proyecto y Arquitectura](ARCHITECTURE.md): Detalles sobre la comunicación frontend-backend y seguridad (JWT).
- [Gestión de Entidades](frontend/docs/ENTITY_MANAGEMENT.md): Guía técnica y de usuario para Productos, Categorías, Variantes e Imágenes.
- [DOCKER.md](DOCKER.md): Guía completa de Docker (instalación, uso, troubleshooting).
- Consulta `frontend/README.md` y `backend/README.md` para instrucciones específicas de cada parte.

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
