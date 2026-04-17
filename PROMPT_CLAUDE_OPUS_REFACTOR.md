# 🚀 PROMPT PARA CLAUDE OPUS 4.6 - REFACTOR INTEGRAL DEL PROYECTO ALLMART

**Fecha:** 17 de abril de 2026  
**Objetivo:** Reorganización, optimización y mejora completa del proyecto sin romper la aplicación  
**Prioridad:** CRÍTICA  
**Duración Estimada:** 40-60 horas de trabajo

---

## 📋 CONTEXTO DEL PROYECTO

AllMart es un e-commerce full-stack con:
- **Frontend:** React + Vite + TypeScript (tienda cliente + panel admin)
- **Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Deployment:** Docker + Docker Compose
- **CI/CD:** GitHub Actions + Git Hooks (Husky)

**Estado Actual:**
- ✅ Funcional pero desordenado
- ⚠️ Raíz con 30+ archivos markdown sueltos
- ⚠️ Datos parcialmente hardcodeados (favoritos, ratings, scores)
- ⚠️ Vistas no responsivas en mobile
- ⚠️ Performance: startup > 0.5s, loading visual confuso
- ⚠️ Tests parcialmente rotos en pre-push hooks
- ⚠️ Estructura de productos desorganizada

---

## 🎯 OBJETIVOS PRINCIPALES

### 1. ✅ REORGANIZACIÓN DE ARQUITECTURA DEL PROYECTO

#### 1.1 Limpiar Raíz del Proyecto
**Estado Actual:** 30+ archivos markdown sueltos en la raíz
**Objetivo:** Dejar solo archivos esenciales

**Archivos que deben moverse:**
```
✓ ADMIN_PERFORMANCE_OPTIMIZATIONS.md      → /docs/tech/
✓ ARCHITECTURE.md                          → /docs/architecture/
✓ BANNERS_IMPLEMENTATION_SUMMARY.md        → /docs/implementations/
✓ DEPLOY.md                                → /docs/deployment/
✓ DOCKER.md                                → /docs/deployment/
✓ DOCU_SECCION_CATEGORIAS.md               → /docs/features/
✓ IMPLEMENTATION_PROMOTIONS.md             → /docs/implementations/
✓ IMPLEMENTATION_SUMMARY.md                → /docs/implementations/
✓ INTEGRATION_PLAN.md                      → /docs/planning/
✓ INTEGRATION_TASKS.md                     → /docs/planning/
✓ INVENTORY.md                             → /docs/operations/
✓ MANAGEMENT_LOG.md                        → /docs/management/
✓ MASTER_DETAIL_REFACTOR_SUMMARY.md        → /docs/implementations/
✓ METRICS.md                               → /docs/operations/
✓ PUNTAJES.md                              → /docs/management/
✓ PROYECTO_100_COMPLETADO.md               → /docs/management/
✓ SCORES.md                                → /docs/management/
✓ SMOOTH_DATA_LOADING_FINAL.md             → /docs/implementations/
✓ SUMMARY.md                               → /docs/
✓ TESTING_VALIDATION_GUIDE.md              → /docs/testing/
✓ MASTER_DETAIL_REFACTOR_SUMMARY.md        → /docs/implementations/

Archivos esenciales que quedan:
- README.md
- package.json
- docker-compose.yml
- docker-compose.prod.yml
- .env.example
- .gitignore
- .editorconfig
```

**Crear estructura de carpetas:**
```
project-root/
├── docs/
│   ├── architecture/
│   │   ├── ARCHITECTURE.md
│   │   └── DATA_MODELS.md
│   ├── deployment/
│   │   ├── DEPLOY.md
│   │   ├── DOCKER.md
│   │   └── DOCKER_TROUBLESHOOTING.md
│   ├── features/
│   │   ├── CATEGORIES.md
│   │   ├── PRODUCTS.md
│   │   ├── ORDERS.md
│   │   └── COLLECTIONS_PROMOTIONS.md
│   ├── implementations/
│   │   ├── BANNERS_IMPLEMENTATION.md
│   │   ├── PROMOTIONS_IMPLEMENTATION.md
│   │   ├── OPTIMIZATION_SUMMARY.md
│   │   └── SMOOTH_DATA_LOADING.md
│   ├── operations/
│   │   ├── INVENTORY.md
│   │   └── METRICS.md
│   ├── management/
│   │   ├── MANAGEMENT_LOG.md
│   │   ├── SCORES.md
│   │   └── PROJECT_STATUS.md
│   ├── planning/
│   │   ├── INTEGRATION_PLAN.md
│   │   └── INTEGRATION_TASKS.md
│   ├── testing/
│   │   ├── TESTING_VALIDATION_GUIDE.md
│   │   ├── TEST_STRATEGY.md
│   │   └── E2E_TESTS.md
│   └── README.md (índice de documentación)
├── scripts/
│   ├── database/
│   │   ├── init-db.sh
│   │   ├── backup-db.sh
│   │   └── restore-db.sh
│   ├── deployment/
│   │   ├── deploy-vps.sh
│   │   ├── deploy-dev.sh
│   │   └── rollback.sh
│   └── setup/
│       ├── setup-dev.sh
│       └── verify-setup.sh
├── seeds/
│   ├── seed-demo.sh
│   ├── seed-production.sh
│   └── seed-backup.sh
├── backend/
├── frontend/
├── docker/
├── .husky/
├── docker-compose.yml
├── docker-compose.prod.yml
├── README.md (solo intro + links a docs)
└── QUICK_START.md
```

#### 1.2 Verificar y Eliminar Carpetas Vacías
- Revisar `/backend/src/` y eliminar cualquier carpeta sin uso
- Revisar `/frontend/src/` y eliminar carpetas obsoletas
- Verificar que no existan: `mocks/`, `test-utils/` sin contenido

#### 1.3 Reorganizar Backend (src/)
```
backend/src/
├── config/          ✅ (mantener como está)
├── types/           ✅ (bien organizado)
├── models/          ✅ (mantener)
├── middlewares/     ✅ (mantener)
├── utils/           ✅ (mantener)
├── services/        ✅ (mantener - ORM/Business Logic)
├── controllers/     ✅ (mantener)
├── routes/          ✅ (mantener)
├── constants/       📁 (CREAR - valores compartidos)
├── helpers/         📁 (CREAR - funciones reutilizables)
├── validators/      📁 (CREAR - validaciones)
├── exceptions/      📁 (CREAR - errores personalizados)
└── mocks/           ❌ (ELIMINAR - usar seeds en lugar)
```

#### 1.4 Reorganizar Frontend (src/)
```
frontend/src/
├── components/      ✅ (reorganizar internamente)
│   ├── common/      (buttons, modals, inputs)
│   ├── layout/      (headers, footers, sidebars)
│   ├── admin/       (componentes admin reutilizables)
│   ├── shop/        (componentes tienda cliente)
│   └── ui/          (UI primitivos)
├── features/        ✅ (mantener - feature-based)
├── pages/           ✅ (mantener)
├── hooks/           ✅ (mantener - custom hooks)
├── services/        ✅ (API clients)
├── context/         ✅ (Context API)
├── constants/       📁 (CREAR - enums, config)
├── types/           ✅ (mantener)
├── utils/           ✅ (funciones helper)
├── styles/          ✅ (global styles)
├── assets/          ✅ (imágenes, iconos)
├── data/            ❌ (ELIMINAR o vaciar - usar DB/API)
├── schemas/         ✅ (Zod/Yup validations)
└── lib/             ✅ (librerías wrapeadas)
```

---

### 2. ⚡ OPTIMIZACIÓN DE RECURSOS Y PERFORMANCE

#### 2.1 Optimización de Imágenes
**Objetivo:** Reducir tamaño de almacenamiento y transferencia

**Implementar:**
```typescript
// backend/src/services/imageOptimizationService.ts
- Convertir AUTOMÁTICAMENTE a WebP
- Generar thumbnails: 100x100, 300x300, 600x600
- Comprimir con calidad 80-85% en WebP
- Eliminar metadatos EXIF
- Usar Sharp library para procesamiento

// Flujo:
1. Usuario sube imagen JPG/PNG
2. Sistema detecta tipo
3. Convierte a WebP (original + thumbnails)
4. Guarda referencias en JSONB images table
5. Retorna URLs de todas las versiones
6. Frontend carga según device (mobile = thumb, desktop = original)
```

**Backend Setup:**
```bash
npm install sharp --save  # Backend solo, no en node_modules compartidos
```

**Cambios en API:**
- Endpoint POST `/admin/products/{id}/images` devuelve array de URLs (webp + sizes)
- Endpoint GET `/products/{id}` retorna array con todas las versiones
- Frontend elige la mejor versión según viewport

#### 2.2 Startup Performance < 0.5 segundos

**Backend (3 segundos → 0.5 segundos):**
```typescript
// backend/src/config/lazyLoading.ts
- Lazy load Prisma Client (solo cuando se necesita)
- Lazy load servicios (importar bajo demanda)
- Usar require en lugar de import solo para rutas iniciales

// backend/src/index.ts
import express from 'express';
const app = express();

// SOLO lo esencial aquí
app.get('/health', (req, res) => res.json({ ok: true }));

// Cargar rutas bajo demanda
app.use('/api', async (req, res, next) => {
  const routes = await import('./routes/index');
  routes.default(app);
  next();
});

// Esto se ejecuta solo una vez la primera petición
```

**Frontend (2 segundos → 0.5 segundos):**
```typescript
// frontend/src/main.tsx
- Usar Vite dynamic imports para rutas
- Lazy load admin context (solo si user es admin)
- Code splitting por feature
- Tree-shaking agresivo

// Reducir bundle inicial:
- Eliminar datos en /data/mock.ts (async load from API)
- Lazy load heavy libraries (charts, forms)
- Split vendor bundles
```

#### 2.3 Loading Management - Mostrar solo cuando está listo

**Frontend App Loading:**
```typescript
// frontend/src/hooks/useAppReady.ts (MEJORAR)
export const useAppReady = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Esperar:
    // 1. Contextos inicializados
    // 2. Usuario autenticado (si existe token)
    // 3. Datos críticos cargados (categorías, banners)
    
    const waitForReady = async () => {
      await Promise.all([
        loadCategories(),
        loadBanners(),
        checkAuth(),
        loadInitialProducts(),
      ]);
      // Solo ENTONCES mostrar la app
      setIsReady(true);
    };

    waitForReady();
  }, []);

  return isReady;
};

// En App.tsx:
// Mostrar FullScreenLoader SOLO mientras no está ready
// Una vez ready, mostrar la app sin loader
```

**Backend Loading:**
```typescript
// Hacer response rápida: <100ms
- Agregar índices en DB (products, categories, variants)
- Cache queries frecuentes (Redis si es posible, o memory cache)
- Paginar resultados por defecto (max 50 items)
```

---

### 3. 📱 REPARAR VISTAS RESPONSIVAS - MOBILE FIRST

#### 3.1 Auditoría de Responsividad

**Componentes a revisar:**
```
Frontend Cliente (Shop):
- HomePage
- ProductListPage
- ProductDetailPage
- CartPage
- Navegación (mobile menu)
- Footer
- Product cards (grid responsivo)
- Banners/Sliders

Frontend Admin:
- AdminDashboard
- AdminProducts (tabla → cards en mobile)
- AdminOrders (tabla → cards en mobile)
- AdminCategories
- Modal dialogs (full screen en mobile)
- Tabs (horizontal scroll en mobile)
```

#### 3.2 Implementar Mobile-First

**Estrategia:**
```typescript
// frontend/src/styles/breakpoints.ts
export const breakpoints = {
  xs: 0,      // Mobile
  sm: 640,    // Tablet pequeña
  md: 1024,   // Tablet
  lg: 1280,   // Desktop
  xl: 1536    // Desktop grande
};

// Usar en componentes:
// <div className={styles.container}> con estilos:
// 320px-640px: Full width, single column, larger touch targets
// 640px-1024px: 2 columns, optimized layout
// 1024px+: 3+ columns, desktop optimized

// NUNCA usar: max-width solo, siempre pensar en min-width también
```

**Cambios específicos:**

1. **ProductCard**
   - Mobile: Full width, image stacked on top
   - Tablet: 2 cols
   - Desktop: 3-4 cols
   - Touch targets: Mínimo 44x44px

2. **AdminTables**
   - Mobile: Renderizar como cards (vertical stack)
   - Mostrar solo campos críticos (name, price, status)
   - Acciones en menu colapsable

3. **Modales/Dialogs**
   - Mobile: 95% width, full height scrollable
   - Desktop: Centered, max-width 600px

4. **Navigation**
   - Mobile: Hamburger menu, full screen overlay
   - Desktop: Horizontal navbar

#### 3.3 Testing Responsividad

```bash
# Usar Lighthouse en desarrollo
npx lighthouse http://localhost:5173 --output-path=lighthouse.html

# Verificar en estos breakpoints:
- 375px (iPhone SE)
- 768px (iPad)
- 1024px (Desktop)

# Verificar touch targets, font sizes, spacing
```

---

### 4. 🏗️ PROPONER ESTRUCTURA ÓPTIMA PARA PRODUCTOS

#### 4.1 Problema Actual
- Productos con datos duplicados (price en DB + mock data)
- Ratings/Reviews sin tabla en DB
- Favoritos solo en localStorage (no sincronizados)
- Imágenes sin optimización
- Variantes confusas con el producto

#### 4.2 Nueva Estructura DB

```sql
-- Tabla Products mejorada
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  shortDescription VARCHAR(500),
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2),
  sku VARCHAR(50) UNIQUE,
  status VARCHAR(50),      -- active, draft, archived
  isVisible BOOLEAN,        -- mostrar en tienda
  isFeatured BOOLEAN,       -- destacado
  rating DECIMAL(3, 2),     -- calculado desde reviews
  reviewCount INT,          -- calculado desde reviews
  viewCount INT,            -- para analytics
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

-- NUEVA: Tabla de Reviews/Ratings
CREATE TABLE productReviews (
  id UUID PRIMARY KEY,
  productId UUID REFERENCES products(id),
  userId UUID REFERENCES users(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  text TEXT,
  helpful INT,
  createdAt TIMESTAMP,
  UNIQUE(productId, userId)  -- Un review por usuario por producto
);

-- NUEVA: Tabla de Favoritos
CREATE TABLE favorites (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  productId UUID REFERENCES products(id),
  createdAt TIMESTAMP,
  UNIQUE(userId, productId)
);

-- Variantes de producto (mejorada)
CREATE TABLE productVariants (
  id UUID PRIMARY KEY,
  productId UUID REFERENCES products(id),
  sku VARCHAR(50),
  type VARCHAR(50),        -- color, size, material
  value VARCHAR(100),      -- rojo, M, algodón
  stock INT,
  price DECIMAL(10, 2),    -- puede diferir del producto base
  isActive BOOLEAN,
  createdAt TIMESTAMP
);

-- Imágenes optimizadas
CREATE TABLE productImages (
  id UUID PRIMARY KEY,
  productId UUID REFERENCES products(id),
  position INT,
  data JSONB {              -- Almacenar todas las versiones
    original: "url/original.webp",
    thumb100: "url/thumb-100.webp",
    thumb300: "url/thumb-300.webp",
    thumb600: "url/thumb-600.webp",
    alt: "descripción",
    uploadedAt: "timestamp"
  },
  createdAt TIMESTAMP
);
```

#### 4.3 Cambios en Frontend

**ProductService mejorado:**
```typescript
// frontend/src/services/productsService.ts
- getProduct(id): Traer con reviews, favorito status, variantes
- getProductReviews(id): Lista paginada de reviews
- createReview(productId, rating, text): Crear review
- addToFavorites(productId): Toggle favorito
- getFavorites(): Lista de productos favoritos del usuario
- searchProducts(query, filters): Search + filtros avanzados
```

**ProductDetailPage:**
```typescript
// Mostrar:
- Galería de imágenes (con versiones optimizadas)
- Reviews section (con formulario para dejar review si está autenticado)
- Promedio de rating calculado en tiempo real
- Botón "Agregar a favoritos" (con sync a DB)
- Variantes en select/radio buttons
- Stock disponible por variante
```

**Eliminar:**
```typescript
- Datos hardcodeados en /data/mock.ts
- Reviews simuladas
- Ratings fakos
```

#### 4.4 Admin Products Management

**Nueva estructura:**
```
/admin/productos/
├── Listado (tabla paginada, buscar, filtrar)
├── Crear producto (form: name, desc, price, categorías)
├── Editar producto (form completo)
├── Galería de imágenes (drag-drop, upload, optimize)
├── Variantes (crear, editar, eliminar)
├── Reviews (moderar, eliminar)
└── Analytics (vistas, favoritos, reviews)
```

---

### 5. 🗄️ HACER DINÁMICOS TODOS LOS DATOS HARDCODEADOS

#### 5.1 Auditoría de Datos Hardcodeados

**Encontrados:**
```
✗ /frontend/src/data/mock.ts
  - 10+ productos con datos ficticios
  - Categorías hardcodeadas
  - Navigation items
  - Sort options

✗ /frontend/src/data/sliderLocalProducts.ts
  - Más productos fake

✗ /backend/src/mocks/mock.ts
  - Datos de seed

✓ Favoritos: localStorage (MOVER A DB)
✓ Ratings: DB pero sin tabla de reviews
✓ Scores: Archivo markdown (MOVER A DB)
```

#### 5.2 Crear Estructura de Config Dinámica

```typescript
// frontend/src/services/configService.ts
- getNavigationMenu(): Cargar del DB o config
- getSortOptions(): Desde backend
- getFilterOptions(): Desde backend

// backend/src/services/configService.ts
- getAllConfig(): Devolver config global
- updateConfig(key, value): Actualizar
```

#### 5.3 Migración de Datos

```sql
-- Crear tabla de config
CREATE TABLE systemConfig (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB,
  updatedAt TIMESTAMP
);

INSERT INTO systemConfig (key, value) VALUES
  ('nav_items', '[...]'),
  ('sort_options', '[...]'),
  ('filter_options', '[...]'),
  ('featured_collections', '[...]');
```

#### 5.4 Eliminar /data/ y mover a servicios

```typescript
// Reemplazar imports de /data/mock.ts con:
const products = await productsService.getProducts();
const categories = await categoriesService.getCategories();
const navigation = await configService.getNavigation();
```

---

### 6. 🧪 REPARAR TESTS DEL PRE-PUSH

#### 6.1 Estado Actual

**Problema:** 
- Tests existen pero pre-push hook no los encuentra
- `npm run test` no está configurado
- Vitest instalado pero no integrado en pipeline

#### 6.2 Implementar Tests

**Backend (backend/):**
```bash
# backend/package.json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}

# Crear tests para:
- Services (productsService, authService, etc)
- Middlewares (auth, errorHandler)
- Validators
- Utils

# Mínimo 70% coverage de funciones críticas
```

**Frontend (frontend/):**
```bash
# frontend/package.json
"scripts": {
  "test": "vitest run --ui",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}

# Tests para:
- Componentes críticos (ProductCard, ProductDetail, Cart)
- Hooks custom (useAppReady, useCart, etc)
- Services (API clients)
- Utils

# Mínimo 60% coverage
```

#### 6.3 Actualizar Pre-push Hook

```bash
# .husky/pre-push
# Cambiar:
run_optional_test_step() -> run_required_test_step()
# O al menos, verificar que existan tests y fallar si alguno rompe
```

#### 6.4 Setup Vitest

```typescript
// frontend/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/']
    }
  }
});
```

---

### 7. 🔧 CHECKLIST DE EJECUCIÓN

#### Fase 1: Preparación (2 horas)
- [ ] Crear estructura de carpetas /docs/
- [ ] Mover todos los .md archivos
- [ ] Verificar que links en .md no rompan
- [ ] Actualizar README.md con nuevos paths
- [ ] Commit: "refactor: reorganize project structure and documentation"

#### Fase 2: Optimización Backend (8 horas)
- [ ] Implementar imageOptimizationService
- [ ] Agregar tablas: productReviews, favorites
- [ ] Crear seed con datos reales
- [ ] Lazy loading en index.ts
- [ ] Agregar índices en DB
- [ ] Setup vitest con tests básicos
- [ ] Commit: "perf: optimize backend startup and image handling"

#### Fase 3: Optimización Frontend (8 horas)
- [ ] Actualizar useAppReady hook
- [ ] Code splitting por feature
- [ ] Lazy load admin context
- [ ] Eliminar /data/mock.ts (usar API)
- [ ] Setup vitest con tests básicos
- [ ] Commit: "perf: optimize frontend startup and bundle size"

#### Fase 4: Responsividad (12 horas)
- [ ] Revisar cada componente cliente
- [ ] Revisar componentes admin
- [ ] Implementar mobile-first CSS
- [ ] Agregar media queries
- [ ] Testear en 375px, 768px, 1024px
- [ ] Commit: "fix: implement mobile-first responsive design"

#### Fase 5: Estructura de Productos (10 horas)
- [ ] Implementar tablas de reviews y favoritos
- [ ] Actualizar ProductCard, ProductDetail
- [ ] Admin: CRUD de reviews
- [ ] Admin: Analytics de productos
- [ ] Commit: "refactor: implement proper product structure with reviews & favorites"

#### Fase 6: Tests (4 horas)
- [ ] Escribir tests críticos backend
- [ ] Escribir tests críticos frontend
- [ ] Actualizar pre-push hook
- [ ] Verificar que todo pase
- [ ] Commit: "test: add critical tests and update pre-push validation"

#### Fase 7: QA & Rollback (4 horas)
- [ ] Verificar todas las rutas funcionan
- [ ] Testing manual en mobile
- [ ] Performance Lighthouse test
- [ ] Backup y rollback plan listo
- [ ] Final commit si todo OK

**Total: 48 horas de trabajo**

---

## 🎓 CRITICA CONSTRUCTIVA POST-REFACTOR

Una vez completado el refactor, analizar:

### Fortalezas Mantenidas:
✅ Arquitectura modular bien pensada (services/controllers/routes)
✅ Separación clara frontend/backend
✅ Uso de Prisma ORM (escalable)
✅ Context API para estado global
✅ Lazy loading de rutas admin

### Mejoras Implementadas:
✅ Estructura documentación clara
✅ Performance startup < 0.5s
✅ Responsividad 100% mobile
✅ Datos dinámicos desde DB
✅ Coverage de tests

### Áreas para Futuros Sprints:

**1. Seguridad (Sprint siguiente)**
- Implementar rate limiting
- CSRF protection
- Input validation en todos los endpoints
- Audit logging de cambios admin

**2. E-commerce Features (Sprint +2)**
- Sistema de cupones/descuentos mejorado
- Wishlist público (compartible)
- Recomendaciones de productos (ML)
- Notificaciones por email
- Sistema de retornos/cambios

**3. Analytics (Sprint +3)**
- Dashboard completo de ventas
- Heatmap de productos vistos
- Funnel analysis
- Reporte de inventario

**4. Escalabilidad (Sprint +4)**
- Implementar Redis caching
- CDN para imágenes
- GraphQL API (alternativa a REST)
- Microservicios (pagos, emails)

**5. Experiencia de Usuario (Sprint +5)**
- Dark mode
- Persistencia de carrito mejorada
- Historial de búsquedas
- Modo offline (PWA)

---

## 📝 NOTAS IMPORTANTES

1. **NO ROMPER LA APLICACIÓN:** Cada cambio debe ser testeable localmente
2. **Commits pequeños:** Cada feature completa = 1 commit
3. **Documentar cambios:** Actualizar README si necesario
4. **Backup:** Antes de cambios DB, hacer backup
5. **Testing:** Verificar que pre-push pase antes de push
6. **Rollback Plan:** Si algo falla, tener estrategia para revertir

---

## 🚀 CÓMO USAR ESTE PROMPT

1. Copiar este contenido completo
2. Enviarlo a Claude Opus 4.6 diciendo: "Por favor, ejecuta este refactor paso a paso, verificando que la aplicación funcione después de cada cambio."
3. Pedirle que:
   - Haga cambios pequeños
   - Verifique funcionamiento
   - Reporte problemas encontrados
   - Sugiera ajustes si es necesario

---

**Creado por:** GitHub Copilot  
**Proyecto:** AllMart E-commerce  
**Versión:** 1.0  
**Estado:** Listo para ejecución
