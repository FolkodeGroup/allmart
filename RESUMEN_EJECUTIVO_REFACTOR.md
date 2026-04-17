# 🎯 RESUMEN EJECUTIVO - REFACTOR ALLMART PARA CLAUDE OPUS 4.6

**Fecha:** 17 de abril de 2026  
**Urgencia:** CRÍTICA  
**Duración:** 40-60 horas

---

## 📌 INSTRUCCIÓN PRINCIPAL

"Refactoriza el proyecto AllMart siguiendo estos 7 puntos sin romper la aplicación. Después de cada cambio importante, verifica que la app funcione ejecutando tests y builds. Reporta bloqueos y sugiere soluciones."

---

## 🎯 LOS 7 OBJETIVOS

### 1. LIMPIEZA DE ARQUITECTURA (2 horas)

**Estado actual:** Raíz del proyecto con 30+ archivos .md sueltos

**Acciones:**
- Crear carpeta `/docs/` con subcarpetas: `architecture/`, `deployment/`, `features/`, `implementations/`, `operations/`, `management/`, `planning/`, `testing/`
- Mover todos los .md de raíz hacia `/docs/` (ver lista completa en PROMPT_CLAUDE_OPUS_REFACTOR.md)
- Crear carpeta `/scripts/` con subcarpetas: `database/`, `deployment/`, `setup/`
- Mover scripts sueltos a `/scripts/`
- Eliminar cualquier carpeta vacía
- Actualizar README.md con links a nueva documentación
- Dejar en raíz SOLO: README.md, package.json, docker-compose.yml, docker-compose.prod.yml, .env.example, .gitignore

**Verificar:**
```bash
npm run build  # Ambos
npm run lint   # Ambos
```

---

### 2. OPTIMIZACIÓN DE PERFORMANCE (6 horas)

**Estado actual:** Startup backend 3s, frontend 2s, loading confuso

**Acciones A - Imágenes:**
- Instalar `sharp` en backend
- Crear `/backend/src/services/imageOptimizationService.ts` que:
  - Convierte a WebP automáticamente
  - Genera thumbnails (100x100, 300x300, 600x600)
  - Comprime con calidad 80-85%
  - Guarda en JSONB: `{original, thumb100, thumb300, thumb600, alt}`

**Acciones B - Backend Startup (<0.5s):**
- Lazy load Prisma en `/backend/src/config/lazyLoading.ts`
- Lazy load servicios (import bajo demanda)
- Verificar que `/api/health` responda en <100ms
- Agregar índices en DB para products, categories, variants

**Acciones C - Frontend Startup (<0.5s):**
- Lazy load admin context (solo si user es admin)
- Code splitting dinámico con Vite
- Eliminar datos hardcodeados de `/data/mock.ts` (cargar desde API)
- Lazy load librerías pesadas (charts, forms)

**Acciones D - Loading Management:**
- Mejorar hook `/frontend/src/hooks/useAppReady.ts`:
  - Esperar a que contextos + datos críticos carguen
  - SOLO mostrar app cuando esté 100% listo
  - No mostrar FullScreenLoader durante la app, solo durante bootstrap

**Verificar:**
```bash
time curl http://localhost:3000/api/health  # <100ms
npm run dev (backend)  # Levanta en <1s
npm run dev (frontend) # Levanta en <1s
```

---

### 3. RESPONSIVIDAD MOBILE FIRST (12 horas)

**Estado actual:** Vistas no responsivas en mobile

**Componentes a revisar:**

Frontend Cliente:
- HomePage, ProductListPage, ProductDetailPage
- CartPage, Navigation, Footer
- ProductCard (grid responsive)
- Banners/Sliders

Frontend Admin:
- AdminDashboard, AdminProducts, AdminOrders
- Modales (full screen en mobile)
- Tablas → cards en mobile

**Acciones:**
- Crear `/frontend/src/styles/breakpoints.ts` con:
  ```javascript
  xs: 0, sm: 640, md: 1024, lg: 1280, xl: 1536
  ```
- Implementar mobile-first (min-width, no max-width)
- ProductCard: full width mobile, 2 cols tablet, 3-4 cols desktop
- AdminTables: cards en mobile (<640px)
- Modales: 95% width en mobile
- Navigation: hamburger en mobile
- Touch targets mínimo 44x44px

**Verificar:**
```bash
# Testear en estos breakpoints:
# - 375px (iPhone SE)
# - 768px (iPad)
# - 1024px (Desktop)

npx lighthouse http://localhost:5173
# Objetivo: Mobile score > 80
```

---

### 4. ESTRUCTURA ÓPTIMA DE PRODUCTOS (8 horas)

**Estado actual:** Datos duplicados, reviews sin tabla, favoritos en localStorage

**BD Changes:**
- Crear tabla `productReviews` (userId, productId, rating, text)
- Crear tabla `favorites` (userId, productId)
- Mejorar tabla `products` (add isVisible, isFeatured)
- Mejorar tabla `productImages` (JSONB con todas las versiones)

**Frontend Changes:**
- ProductDetailPage: mostrar reviews reales + formulario
- ProductCard: datos desde DB, no mock
- Eliminar `/frontend/src/data/` (no debe tener datos hardcodeados)
- Admin: gestionar reviews, ver favoritos por producto

**Backend Changes:**
- Nuevo endpoint: `GET /api/products/:id/reviews`
- Nuevo endpoint: `POST /api/products/:id/reviews` (crear review)
- Nuevo endpoint: `POST /api/favorites/:productId` (toggle)
- Nuevo endpoint: `GET /api/favorites` (mis favoritos)

**Verificar:**
```bash
# Verificar que ProductDetail carga reviews desde API
# Verificar que agregar review se persiste en DB
# Verificar que favoritos se guardan en DB (no localStorage)
```

---

### 5. HACER DINÁMICOS TODOS LOS DATOS (4 horas)

**Estado actual:** Datos hardcodeados en mock.ts, config, navigation

**Acciones:**
- Eliminar `/frontend/src/data/mock.ts` (ya no se necesita)
- Reemplazar imports de mock con llamadas a API:
  ```javascript
  // Antes:
  import { products } from '@/data/mock';
  
  // Después:
  const products = await productsService.getProducts();
  ```
- Crear `/backend/src/services/configService.ts` que devuelva:
  - navigation items
  - sort options
  - filter options
  - featured collections

- Endpoints nuevo:
  - `GET /api/config/navigation`
  - `GET /api/config/sort-options`
  - `GET /api/config/filters`

**Verificar:**
```bash
# No debe haber imports de /data/mock en el código
# HomePage debe cargar desde API todos los datos
```

---

### 6. REPARAR TESTS (4 horas)

**Estado actual:** Tests existen pero pre-push no los ejecuta

**Acciones:**
- Setup vitest en backend y frontend
- Crear tests críticos:
  - Backend: productsService, authService, middlewares
  - Frontend: ProductCard, ProductDetail, Cart, hooks
- Mínimo: 70% backend, 60% frontend coverage
- Actualizar `.husky/pre-push` para ejecutar tests COMO REQUIRED (no opcional)

**Scripts a agregar:**
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

**Verificar:**
```bash
cd backend && npm test    # Debe pasar
cd frontend && npm test   # Debe pasar
git push                  # pre-push debe pasar
```

---

### 7. CRÍTICA CONSTRUCTIVA POST-REFACTOR (1 hora)

**Analizar y documentar:**

Fortalezas a mantener:
- Arquitectura modular (services/controllers/routes)
- Separación frontend/backend clara
- Uso de Prisma ORM

Mejoras logradas:
- Performance: 3s → 0.5s startup
- Responsividad: 100% mobile
- Datos: 100% dinámicos
- Tests: automatizados

Próximos pasos (para sprints futuros):
- Seguridad: rate limiting, CSRF, audit logging
- Features: sistema de cupones, wishlist público, recomendaciones
- Analytics: dashboard de ventas, heatmaps
- Escalabilidad: Redis caching, CDN, GraphQL
- UX: dark mode, PWA, historial búsquedas

---

## 🔍 VALIDACIÓN ENTRE CAMBIOS

Después de cada sección, ejecutar:

```bash
# Backend
cd backend
npm run lint
npm run build
npm run test

# Frontend
cd frontend
npm run lint
npm run build
npm run test

# Docker
docker-compose down
docker-compose up --build
# Verificar en http://localhost:8080
```

Si algo falla:
1. DETENER todo
2. Reportar el error
3. Proponer solución
4. No avanzar hasta que esté 100% funcional

---

## 📋 ORDEN DE EJECUCIÓN

1. **Limpieza** → Commits: documentación y estructura
2. **Performance** → Commits: startup, images, lazy loading
3. **Responsividad** → Commits: mobile CSS, componentes
4. **Productos** → Commits: DB, frontend, admin
5. **Datos** → Commits: eliminar mock, usar API
6. **Tests** → Commits: vitest setup, coverage
7. **QA** → Documento de crítica constructiva

---

## ✅ REGLAS CLAVE

1. ✋ NUNCA romper la aplicación - verify después de cada cambio
2. 📦 Commits pequeños - cada feature = 1 commit
3. 🧪 Tests - ejecutar pre-push
4. 📝 Documentar - actualizar README si cambian rutas
5. 🔄 Rollback plan - tener estrategia si falla algo
6. 🚨 Si hay bloqueo - reportar inmediatamente
7. ⏱️ Tiempo estimado: 40-60 horas

---

## 🚀 CÓMO ENVIAR ESTO A CLAUDE OPUS 4.6

1. Copiar este documento completo
2. Enviar mensaje:

```
Por favor, ejecuta este refactor del proyecto AllMart paso a paso.

Instrucciones:
- Sigue los 7 objetivos en orden
- Después de cada cambio importante, verifica que la app funcione
- Ejecuta tests y builds para validar
- Si encuentras problemas, reporta y sugiere solución
- No avances hasta que todo esté 100% funcional
- Usa commits pequeños y descriptivos
- Documenta cambios que afecten estructura

Aquí están los 7 objetivos detallados:
[PEGAR CONTENIDO]
```

3. Monitorear que:
   - No rompa commits
   - Cada cambio esté testeado
   - Documentación esté actualizada
   - Pre-push hook pase
   - App funcione en http://localhost:8080

---

**Creado por:** GitHub Copilot  
**Proyecto:** AllMart E-commerce  
**Versión:** 2.0 (Resumida)  
**Estado:** ✅ Listo para ejecutar
