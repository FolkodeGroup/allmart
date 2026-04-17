# ⚡ COPY-PASTE READY - PROMPT PARA CLAUDE OPUS 4.6

**Instrucciones:** Copia TODO este contenido (desde "Proyecto: AllMart" hasta el final) y pégalo en un chat nuevo con Claude Opus 4.6.

---

Proyecto: AllMart - E-commerce de hogar/cocina
Stack: React + Vite (frontend) + Node.js + Express + PostgreSQL (backend)
Estado: Funcional pero requiere refactor urgente
Tu tarea: Ejecutar 7 objetivos de refactorización

INSTRUCCIONES CRÍTICAS:
✓ Sigue el orden exacto (Objetivo 1 → 2 → 3... hasta 7)
✓ Después de cambios >100 líneas: ejecuta tests, verifica que app funcione
✓ Haz commits pequeños (máximo 1 objetivo por commit)
✓ Si hay error: DETÉN TODO, reporta sin avanzar
✓ Actualiza documentación si cambias estructura
✓ Todos los cambios deben ser verificables localmente

---

## 🎯 OBJETIVO 1: LIMPIEZA DE ARQUITECTURA (2 horas)

**Estado actual:** 30+ archivos .md sueltos en raíz del proyecto

**Acciones:**

1. Crear estructura de carpetas en raíz:
   ```
   mkdir -p docs/{architecture,deployment,features,implementations,operations,management,planning,testing}
   mkdir -p scripts/{database,deployment,setup}
   mkdir -p seeds
   ```

2. Mover archivos .md según categoría (COPIAR path exacto):
   ```
   docs/architecture/: ARCHITECTURE.md
   docs/deployment/: DEPLOY.md, DOCKER.md
   docs/features/: DOCU_SECCION_CATEGORIAS.md, BANNERS_IMPLEMENTATION_SUMMARY.md
   docs/implementations/: IMPLEMENTATION_PROMOTIONS.md, IMPLEMENTATION_SUMMARY.md, MASTER_DETAIL_REFACTOR_SUMMARY.md, SMOOTH_DATA_LOADING_FINAL.md, ADMIN_PERFORMANCE_OPTIMIZATIONS.md
   docs/operations/: INVENTORY.md, METRICS.md
   docs/management/: MANAGEMENT_LOG.md, PUNTAJES.md, PROYECTO_100_COMPLETADO.md, SCORES.md
   docs/planning/: INTEGRATION_PLAN.md, INTEGRATION_TASKS.md
   docs/testing/: TESTING_VALIDATION_GUIDE.md
   ```

3. Mover scripts sueltos:
   ```
   scripts/: seed-demo.sh, start-backend.sh, start-db-tunnel.sh, start-frontend.sh
   ```

4. Eliminar carpetas backend/src/moks/ (usar seeds)

5. Crear /docs/README.md con índice de documentación

6. Actualizar README.md raíz:
   - Remover referencias a archivos que se movieron
   - Agregar links a /docs/
   - Mantener solo instrucciones quick-start

7. Verificar que no rompan links en documentos (reemplazar paths si es necesario)

**Validar:**
```bash
# Debe pasar
npm run lint (backend)
npm run lint (frontend)
npm run build (backend)
npm run build (frontend)

# Verificar estructura
ls -la docs/
ls -la scripts/
# No debe haber .md en raíz excepto: README.md, GUIA_USO_PROMPTS.md, RESUMEN_EJECUTIVO_REFACTOR.md, PROMPT_CLAUDE_OPUS_REFACTOR.md, ANALISIS_ESTADO_ACTUAL.md
```

**Commit:**
```bash
git add -A
git commit -m "refactor: reorganize documentation and scripts structure"
```

---

## ⚡ OBJETIVO 2: OPTIMIZACIÓN DE PERFORMANCE (6 horas)

### 2.A: Optimización de Imágenes

**Crear archivo:** backend/src/services/imageOptimizationService.ts

Debe:
- Instalar `sharp` (npm install sharp --save en backend/)
- Convertir todas las imágenes a WebP
- Generar thumbnails: 100x100, 300x300, 600x600
- Comprimir con calidad 80-85%
- Retornar objeto con todas las versiones:
```json
{
  "original": "url/imagen.webp",
  "thumb100": "url/imagen-100.webp",
  "thumb300": "url/imagen-300.webp",
  "thumb600": "url/imagen-600.webp",
  "alt": "descripción"
}
```

**Actualizar endpoint:** backend/src/routes/admin/products/images.ts
- Cambiar response para incluir todas las versiones
- Frontend elige la mejor versión según device

**Validar:**
```bash
# Backend debe compilar
cd backend && npm run lint && npm run build

# Probar upload de imagen (si hay admin panel)
curl -X POST http://localhost:3000/api/admin/products/1/images \
  -F "image=@test.jpg"
```

### 2.B: Backend Startup < 0.5 segundos

**Crear archivo:** backend/src/config/lazyLoading.ts

Implementar lazy loading para Prisma Client

**Modificar:** backend/src/index.ts

```typescript
// SOLO lo esencial en startup
const app = express();
app.get('/health', (req, res) => res.json({ ok: true }));

// Health endpoint debe responder en <100ms
```

**Agregar índices en DB:** backend/prisma/migrations/XXX_add_indexes.sql

```sql
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON productVariants(productId);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
```

**Validar:**
```bash
# Debe ejecutarse en <1 segundo
time curl http://localhost:3000/api/health
# Real time debe ser < 0.2s

# Backend debe levantar en < 1s después de inicio
npm run dev &
sleep 1
curl http://localhost:3000/api/health
# Debe responder exitosamente
```

### 2.C: Frontend Startup < 0.5 segundos

**Modificar:** frontend/src/App.tsx

- Sacar providers admin del root (mover a AdminLayout)
- Lazy load context de admin

**Modificar:** frontend/src/main.tsx

- Agregar code splitting dinámico

**Verificar:**
```bash
# Build debe ser < 2s
npm run build

# Bundle size
ls -lh dist/index.html
# Debe ser < 500KB
```

### 2.D: Loading Management

**Mejorar:** frontend/src/hooks/useAppReady.ts

```typescript
export const useAppReady = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const waitForReady = async () => {
      // Esperar TODO en paralelo
      await Promise.all([
        loadCategories(),
        loadBanners(),
        checkAuth(),
        loadInitialProducts(),
      ]);
      // SOLO ENTONCES mostrar app
      setIsReady(true);
    };

    waitForReady();
  }, []);

  return isReady;
};
```

**Validar:**
```bash
# App debe levantar en http://localhost:5173 sin FullScreenLoader visible
# Una vez listo, debe mostrar contenido sin parpadeo
```

**Commits:**
```bash
git commit -m "perf: add image optimization service"
git commit -m "perf: lazy load prisma and backend startup"
git commit -m "perf: optimize frontend bundle and startup"
git commit -m "perf: improve loading management"
```

---

## 📱 OBJETIVO 3: RESPONSIVIDAD MOBILE FIRST (12 horas)

**Crear archivo:** frontend/src/styles/breakpoints.ts

```typescript
export const breakpoints = {
  xs: 0,      // Mobile
  sm: 640,    // Tablet pequeña
  md: 1024,   // Tablet
  lg: 1280,   // Desktop
  xl: 1536    // Desktop grande
};

// Uso en componentes:
// min-width: 0px  (mobile)
// min-width: 640px (tablet)
// min-width: 1024px (desktop)
```

### Componentes Cliente a Revisar:

1. **ProductCard**
   - Mobile (0-640px): Full width, imagen grande
   - Tablet (640-1024px): 2 columnas
   - Desktop (1024px+): 3-4 columnas
   - Touch targets: mínimo 44x44px

2. **ProductListPage**
   - Filtros en drawer (mobile), sidebar (tablet+)
   - Grid responsive

3. **ProductDetailPage**
   - Imagen en top (mobile), lado izquierdo (desktop)
   - Info en bottom (mobile), derecha (desktop)

4. **CartPage**
   - Vertical stack (mobile)
   - Tabla + sidebar (desktop)

5. **Navigation**
   - Hamburger menu (mobile)
   - Navbar horizontal (desktop)

6. **Footer**
   - Collapse en mobile
   - Expandido en desktop

### Componentes Admin a Revisar:

1. **AdminTables**
   - Mobile: Cards verticales (id, nombre, acciones)
   - Desktop: Tabla normal

2. **AdminDashboard**
   - Charts responsive
   - Grid se adapta

3. **Modales/Dialogs**
   - Mobile: 95% width, full height
   - Desktop: centered, max 600px

**Verificar responsividad:**
```bash
# Abrir DevTools (F12)
# Activar Device Mode (Ctrl+Shift+M)
# Testear en:
# - iPhone SE (375px): Todo legible
# - iPad (768px): Layout optimizado
# - Desktop (1280px+): No hay espacios vacíos

# O usar Lighthouse
npx lighthouse http://localhost:5173 --preset=mobile
# Score debe ser > 80
```

**Commits:**
```bash
git commit -m "fix: implement mobile-first responsive design"
```

---

## 🏗️ OBJETIVO 4: ESTRUCTURA ÓPTIMA DE PRODUCTOS (8 horas)

### 4.A: Crear Tablas BD

**Nueva migration:** backend/prisma/migrations/XXX_add_reviews_and_favorites.sql

```sql
CREATE TABLE IF NOT EXISTS productReviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  productId UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  text TEXT,
  helpful INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(productId, userId)
);

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  productId UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(userId, productId)
);

CREATE INDEX idx_product_reviews_product_id ON productReviews(productId);
CREATE INDEX idx_product_reviews_user_id ON productReviews(userId);
CREATE INDEX idx_favorites_user_id ON favorites(userId);
CREATE INDEX idx_favorites_product_id ON favorites(productId);
```

**Ejecutar migration:**
```bash
cd backend
npx prisma migrate deploy
```

### 4.B: Backend Services

**Crear:** backend/src/services/reviewsService.ts
- getProductReviews(productId): lista paginada
- createReview(productId, userId, rating, text)
- deleteReview(reviewId)

**Crear:** backend/src/services/favoritesService.ts
- addFavorite(userId, productId)
- removeFavorite(userId, productId)
- getFavorites(userId)
- isFavorite(userId, productId)

### 4.C: Backend Controllers & Routes

**Crear:** backend/src/controllers/public/reviewsController.ts
**Crear:** backend/src/routes/public/reviews.ts

Endpoints:
```
GET /api/products/:id/reviews
POST /api/products/:id/reviews (autenticado)
DELETE /api/reviews/:id (autenticado)
```

**Crear:** backend/src/routes/public/favorites.ts

Endpoints:
```
GET /api/favorites (autenticado)
POST /api/favorites/:productId (autenticado)
DELETE /api/favorites/:productId (autenticado)
GET /api/favorites/:productId/check (check si es favorito)
```

### 4.D: Frontend Services & Hooks

**Crear:** frontend/src/services/reviewsService.ts
**Crear:** frontend/src/services/favoritesService.ts
**Crear:** frontend/src/hooks/useFavorites.ts

### 4.E: Frontend Components

**Actualizar:** frontend/src/pages/ProductDetail/ProductDetailPage.tsx
- Mostrar reviews (lista + promedio)
- Formulario para dejar review (si autenticado)
- Botón favoritos

**Actualizar:** frontend/src/features/products/ProductCard/ProductCard.tsx
- Botón favoritos funcional
- Rating desde BD

### 4.F: Admin Features

**Crear:** frontend/src/features/admin/reviews/AdminReviews.tsx
- Listar reviews
- Moderar (aprobar/rechazar)
- Ver por producto

**Validar:**
```bash
# Backend debe compilar
npm run lint && npm run build

# Probar endpoints
curl http://localhost:3000/api/products/1/reviews
# Debe retornar array vacío o reviews

# Frontend debe mostrar reviews sin errors
npm run lint && npm run build
```

**Commits:**
```bash
git commit -m "refactor: add reviews and favorites database tables"
git commit -m "feat: implement reviews service and controllers"
git commit -m "feat: implement favorites service and endpoints"
git commit -m "feat: add reviews and favorites UI components"
```

---

## 🗄️ OBJETIVO 5: HACER DINÁMICOS TODOS LOS DATOS (4 horas)

### 5.A: Eliminar Datos Hardcodeados

**Eliminar archivo:** frontend/src/data/mock.ts
**Eliminar archivo:** frontend/src/data/sliderLocalProducts.ts

### 5.B: Reemplazar Imports

**Buscar y reemplazar en todo frontend/src/:**
```
// Antes:
import { products } from '@/data/mock';

// Después:
const products = await productsService.getProducts();
```

**Archivos a revisar:**
- frontend/src/App.tsx
- frontend/src/pages/Home/HomePage.tsx
- frontend/src/pages/ProductList/ProductListPage.tsx
- Cualquier otro que use datos de /data/

### 5.C: Config Dinámica

**Crear:** backend/src/services/configService.ts

Retornar desde DB:
- Navigation items
- Sort options
- Filter options
- Featured collections

**Crear endpoints:**
```
GET /api/config/navigation
GET /api/config/sort-options
GET /api/config/filters
```

**Crear:** frontend/src/services/configService.ts

Llamar endpoints anteriores

### 5.D: Actualizar Homepage

frontend/src/pages/Home/HomePage.tsx

```typescript
// Usar servicios en lugar de mock
const products = await productsService.getProducts();
const navigation = await configService.getNavigation();
const collections = await collectionsService.getHomeCollections();
```

**Validar:**
```bash
# No debe haber imports de /data/ en el código
grep -r "from '@/data/" frontend/src/

# HomePage debe cargar sin errors
# Verificar que productos, categorías y banners aparezcan
```

**Commits:**
```bash
git commit -m "refactor: remove hardcoded mock data"
git commit -m "feat: implement dynamic config service"
git commit -m "feat: make homepage fully dynamic"
```

---

## 🧪 OBJETIVO 6: REPARAR TESTS (4 horas)

### 6.A: Setup Backend Tests

**Archivo:** backend/package.json

Agregar scripts:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

**Archivo:** backend/vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/']
    }
  }
});
```

### 6.B: Setup Frontend Tests

**Archivo:** frontend/package.json

Agregar scripts:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

**Verificar:** frontend/vitest.config.ts (debe existir)

### 6.C: Escribir Tests Críticos

**Backend tests:**
- Services (productsService, authService, reviewsService)
- Middlewares (auth, permissions)
- Utils

Mínimo: 70% coverage de funciones críticas

**Frontend tests:**
- ProductCard component
- ProductDetailPage
- CartPage
- Custom hooks (useFavorites, etc)

Mínimo: 60% coverage

### 6.D: Actualizar Pre-push Hook

**Archivo:** .husky/pre-push

Cambiar:
```bash
# De: run_optional_test_step (opcional)
# A: run_required_test_step (obligatorio)

# O al menos verificar que npm test existe y ejecutarlo
```

**Validar:**
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Pre-push debe pasar
git push  # Debe ejecutar validaciones y dejarla pasar
```

**Commits:**
```bash
git commit -m "test: setup vitest and add critical tests (backend)"
git commit -m "test: setup vitest and add critical tests (frontend)"
git commit -m "fix: update pre-push hook to require tests"
```

---

## 🎓 OBJETIVO 7: CRÍTICA CONSTRUCTIVA (1 hora)

Después de completar los 6 objetivos, analizar:

**Crear archivo:** docs/management/REFACTOR_CRITIQUE.md

Debe incluir:

1. **Fortalezas Mantenidas**
   - Qué estuvo bien en arquitectura original

2. **Mejoras Logradas**
   - Performance: 3s → 0.5s startup
   - Responsividad: 0% → 100% mobile
   - Datos: 0% → 100% dinámicos

3. **Problemas Encontrados Durante Refactor**
   - Qué fue más difícil de lo esperado
   - Qué salió mejor

4. **Recomendaciones para Futuros Sprints**
   - Seguridad (rate limiting, CSRF)
   - Features (wishlist, recomendaciones)
   - Analytics
   - Escalabilidad (Redis, CDN)

5. **Métricas Finales**
   - Before vs After en tablas

**Commits:**
```bash
git commit -m "docs: add refactor critique and recommendations"
```

---

## ✅ LISTA DE VERIFICACIÓN FINAL

Antes de decir "COMPLETADO":

- [ ] Todos 7 objetivos implementados
- [ ] npm run build en backend y frontend sin errores
- [ ] npm run lint en backend y frontend sin errores
- [ ] npm test en backend y frontend pasan
- [ ] Pre-push hook ejecuta exitosamente
- [ ] App corre en http://localhost:8080 sin errores
- [ ] App responsiva en 375px, 768px, 1024px (verificar manual)
- [ ] Performance < 0.5s startup (verificar con curl y npm start)
- [ ] Lighthouse score > 80 en mobile
- [ ] Favoritos se guardan en DB (no localStorage)
- [ ] Reviews funcionan (crear, editar, mostrar)
- [ ] Datos son 100% dinámicos (sin /data/mock.ts)
- [ ] Documentación en /docs/ accesible
- [ ] 7 commits limpios, uno por objetivo
- [ ] Crítica constructiva documentada

---

**FIN DEL PROMPT**

Ahora que recibas este mensaje, comienza:
1. Lee TODO el prompt (arriba)
2. Di: "Entendido. Comenzando OBJETIVO 1: Limpieza de Arquitectura"
3. Sigue paso a paso el Objetivo 1
4. Después de cada paso importante, verifica que compile/funcione
5. Cuando termines Objetivo 1, reporta: "✅ OBJETIVO 1 COMPLETADO"
6. Continúa con Objetivo 2, y así sucesivamente
7. Si hay error, NO avances: reporta el error, propón solución, espera aprobación

¿Entendido? Comienza cuando estés listo.
