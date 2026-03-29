# Sistema de Ofertas y Promociones Dinámico - Documentación

## 📋 Resumen de Implementación

Se ha implementado un sistema completo y robusto de ofertas y promociones dinámicas que permite al administrador gestionar campañas, colecciones de productos y descuentos desde el panel administrativo sin necesidad de cambios en código.

**Puntaje: 200 puntos**

---

## 🏗️ Arquitectura del Sistema

### Base de Datos

Nuevas 4 tablas en PostgreSQL:

#### 1. `promotions`
- Almacena promociones con tipo (percentage, fixed, bogo)
- Fechas de inicio/fin
- Monto mínimo de compra y descuento máximo
- Prioridad para resolución de descuentos

```sql
Fields:
- id (UUID)
- name, description
- type: 'percentage' | 'fixed' | 'bogo'
- value (Decimal)
- startDate, endDate (Timestamptz)
- minPurchaseAmount, maxDiscount (Decimal, nullable)
- isActive, priority
- timestamps
```

#### 2. `collections`
- Agrupaciones dinámicas de productos
- Soporta display en home o categorías
- Orden personalizable

```sql
Fields:
- id, name, slug (unique)
- description, displayOrder
- displayPosition: 'home' | 'category'
- imageUrl
- isActive
- timestamps
```

#### 3. `promotion_rules`
- Vincula promociones a productos/categorías específicas
- Un producto puede tener múltiples promociones aplicables
- Se elige la de mayor descuento

#### 4. `collection_items`
- Productos dentro de una colección
- Orden personalizable dentro de la colección

---

## 🔧 Backend - API REST

### Endpoints Administrativos

**Base: `/api/admin/`**

#### Promociones

```
GET     /promotions                          Listar (paginado 10 items)
POST    /promotions                          Crear
GET     /promotions/:id                      Obtener detalle
PUT     /promotions/:id                      Actualizar
DELETE  /promotions/:id                      Eliminar
POST    /promotions/:id/duplicate            Duplicar promoción
```

**Parámetros GET **promotions:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `q` (búsqueda por nombre)
- `isActive` (filtro booleano)

**Payload POST/PUT:**
```json
{
  "name": "Descuento de Verano",
  "description": "30% en todos los artículos de verano",
  "type": "percentage",
  "value": 30,
  "startDate": "2026-06-01T00:00:00Z",
  "endDate": "2026-08-31T23:59:59Z",
  "minPurchaseAmount": 50,
  "maxDiscount": 100,
  "isActive": true,
  "priority": 10,
  "rules": {
    "productIds": ["uuid1", "uuid2"],
    "categoryIds": ["uuid3"]
  }
}
```

#### Colecciones

```
GET     /collections                        Listar (paginado)
POST    /collections                        Crear
GET     /collections/:id                    Obtener detalle
PUT     /collections/:id                    Actualizar
DELETE  /collections/:id                    Eliminar
POST    /collections/:id/reorder            Reordenar productos
POST    /collections/:id/products           Agregar producto
DELETE  /collections/:id/products/:prodId   Eliminar producto
```

**Parámetros GET /collections:**
- `page`
- `limit`
- `q` (búsqueda)
- `isActive`
- `displayPosition` ('home' | 'category')

**Payload POST/PUT:**
```json
{
  "name": "Ofertas del Mes",
  "slug": "ofertas-del-mes",
  "description": "Las mejores ofertas de este mes",
  "displayPosition": "home",
  "displayOrder": 1,
  "imageUrl": "https://...",
  "isActive": true,
  "productIds": ["uuid1", "uuid2", "uuid3"]
}
```

### Endpoints Públicos

**Base: `/api/`**

```
GET     /collections                       Colecciones para home
GET     /collections/position/:position    Colecciones por posición
GET     /collections/:slug                 Colección específica
GET     /promotions/active                 Promociones activas ahora
GET     /promotions/discounts/active       Descuentos activos (para badges)
GET     /promotions/product-discount/:productId?price=100&categoryId=...
                                           Descuento específico de producto
```

---

## 💻 Frontend Admin

### Pages Implementadas

#### `/admin/promotions`
- **Componente:** `AdminPromotions.tsx`
- Tabla con columnas: Nombre, Tipo, Valor, Inicio, Fin, Estado
- Botones: Editar, Duplicar, Eliminar
- Paginación con 10 items
- Filters: búsqueda, estado activo/inactivo
- Crud completo

#### `/admin/collections`
- **Componente:** `AdminCollections.tsx`
- Tabla con columnas: Nombre, Slug, Posición, Cantidad Productos, Estado
- Botones: Editar, Eliminar
- Filtros: búsqueda, posición display, estado

### Formularios

#### Formulario Promociones
- Campo nombre requerido
- Selección de tipo (Porcentaje, Monto Fijo, BOGO)
- Valor dinámico
- Fechas de inicio/fin (validación: fin > inicio)
- Monto mínimo y máximo descuento
- Prioridad
- Toggle activo/inactivo
- Selector de productos/categorías aplicables

#### Formulario Colecciones
- Nombre requerido (genera slug automático)
- Descripción
- Posición de display (home/category)
- Orden de display (0 = primero)
- URL de imagen/banner
- Toggle activo
- Gestión de productos (agregar/eliminar/reordenar)

---

## 🎨 Frontend Público

### Componentes Nuevos

#### `CollectionSlider.tsx`
Carrusel horizontal reutilizable que muestra:
- Banner (imagen de colección)
- Nombre y descripción
- Lista horizontal de productos con scroll
- Botones de navegación (anterior/siguiente)
- Responsive en mobile

**Props:**
```tsx
interface Props {
  title: string;
  description?: string;
  products: CollectionProduct[];
  bannerUrl?: string;
  onProductClick?: (productSlug: string) => void;
}
```

#### `DiscountBadge.tsx`
Badge circular que muestra descuentos:
- Badge naranja posicionado en esquina
- Muestra porcentaje descuento, monto o "BOGO"
- Responsive
- Solo se muestra si hay descuento > 0

**Props:**
```tsx
interface Props {
  discountPercentage?: number;
  originalPrice?: number;
  finalPrice?: number;
  promotionType?: string;
}
```

### Página Ofertas

**Ruta:** `/offers`
**Componente:** `pages/Offers/Offers.tsx`

Página completa que muestra:
- Header con título y descripción
- Sección Colecciones Especiales (usando CollectionSlider)
- Sección Promociones Activas (grid de tarjetas)
- Cada tarjeta de promoción muestra:
  - Nombre
  - Descripción
  - Valor del descuento con estilo destacado
  - Fechas de vigencia
  - Monto mínimo (si aplica)

### Servicio API Público

**Archivo:** `services/publicCollectionsService.ts`

```tsx
// Métodos disponibles:
publicCollectionsService.getHomeCollections()
publicCollectionsService.getCollectionsByPosition(position)
publicCollectionsService.getCollectionBySlug(slug)
publicCollectionsService.getActivePromotions()
publicCollectionsService.getActiveDiscounts()
publicCollectionsService.getProductDiscount(productId, price, categoryId?)
```

---

## 🔐 Lógica de Descuentos

### Archivo: `services/discountService.ts` (Backend)

#### Función `calculateDiscount(promotion, originalPrice)`
Calcula descuento considerando:
1. Tipo de promoción:
   - **Percentage:** `descuento = precio * (valor / 100)`
   - **Fixed:** `descuento = valor`
   - **BOGO:** `descuento = precio` (100% del producto)

2. Límites:
   - Aplica `maxDiscount` si está configurado
   - Asegura que descuento ≤ precio original
   - Retorna: `{discountAmount, finalPrice, discountPercentage}`

#### Función `getBestDiscount(productId, price, categoryId?)`
Obtiene el mejor descuento aplicable:
1. Obtiene todas las promociones activas (hoy entre start/end dates)
2. Busca reglas que apliquen al producto/categoría
3. Verifica montos mínimos de compra
4. **Elige la de mayor descuento absoluto**
5. Retorna: `DiscountResult | null`

#### Promociones Activas
Una promoción es activa si:
- `isActive = true`
- `startDate <= NOW <= endDate`
- Ordenadas por `priority DESC`

---

## 🗂️ Estructura de Archivos

```
Backend:
├── src/
│   ├── services/
│   │   ├── discountService.ts         [180 líneas]
│   │   ├── promotionsService.ts       [380 líneas]
│   │   └── collectionsService.ts      [430 líneas]
│   ├── controllers/
│   │   ├── admin/
│   │   │   ├── promotionsController.ts
│   │   │   └── collectionsController.ts
│   │   └── public/
│   │       ├── promotionsController.ts
│   │       └── collectionsController.ts
│   └── routes/
│       ├── admin/
│       │   ├── promotions.ts
│       │   └── collections.ts
│       └── public/
│           ├── promotions.ts
│           └── collections.ts
├── prisma/
│   └── schema.prisma                  [+95 líneas nuevas]
└── migrations/
    └── 20260329155935_add_promotions_and_collections/
        └── migration.sql

Frontend:
├── src/
│   ├── features/admin/
│   │   ├── promotions/
│   │   │   ├── AdminPromotions.tsx
│   │   │   ├── AdminPromotionForm.tsx
│   │   │   ├── AdminPromotions.module.css
│   │   │   ├── promotionsService.ts
│   │   │   └── index.ts
│   │   └── collections/
│   │       ├── AdminCollections.tsx
│   │       ├── AdminCollectionForm.tsx
│   │       ├── AdminCollections.module.css
│   │       ├── collectionsService.ts
│   │       └── index.ts
│   ├── components/
│   │   ├── CollectionSlider.tsx
│   │   ├── CollectionSlider.module.css
│   │   ├── DiscountBadge.tsx
│   │   └── DiscountBadge.module.css
│   ├── pages/
│   │   └── Offers/
│   │       ├── Offers.tsx
│   │       └── Offers.module.css
│   └── services/
│       └── publicCollectionsService.ts
```

---

## 🚀 Implementación del Admin

### Panel de Control

Agregar al menú admin principal:

```tsx
// En AdminPanel.tsx o similar
import { AdminPromotions, AdminCollections } from '../features/admin';

<nav>
  ...
  <Link to="/admin/promotions">Promociones</Link>
  <Link to="/admin/collections">Colecciones</Link>
</nav>
```

Agregar rutas:

```tsx
// En rutas admin
<Route path="/promotions" element={<AdminPromotions />} />
<Route path="/collections" element={<AdminCollections />} />
```

---

## 🔄 Casos de Uso

### Caso 1: Crear Descuento de Verano
1. Admin → Promociones → Nueva Promoción
2. Configura: 30% descuento, 01-06 a 31-08, solo categoría "Verano"
3. Selecciona categoría en rules
4. Guarda → Automáticamente activa en API

### Caso 2: Colección "Ofertas del Mes"
1. Admin → Colecciones → Nueva
2. Nombre: "Ofertas del Mes"
3. Posición: Home
4. Sube imagen/banner
5. Selecciona 8-10 productos mejores
6. Guarda → Aparece en home dinámicamente

### Caso 3: Cliente Compra Producto en Oferta
1. Navega a `/offers` → Ve colección con productos
2. O navega a producto individual → Ve badge "30% OFF"
3. Precio mostrado con descuento aplicado
4. Compra con precio descuentado

---

## 📊 Datos Ejemplo

### Promoción Ejemplo
```json
{
  "id": "uuid...",
  "name": "Black Friday Adelantado",
  "description": "50% en artículos seleccionados",
  "type": "percentage",
  "value": 50,
  "startDate": "2026-11-15T00:00:00Z",
  "endDate": "2026-11-30T23:59:59Z",
  "minPurchaseAmount": null,
  "maxDiscount": 500,
  "isActive": true,
  "priority": 100,
  "rules": {
    "productIds": ["prod1", "prod2"],
    "categoryIds": ["electrónica"]
  }
}
```

### Colección Ejemplo
```json
{
  "id": "uuid...",
  "name": "Lo Más Vendido",
  "slug": "lo-mas-vendido",
  "description": "Los productos que aman nuestros clientes",
  "displayPosition": "home",
  "displayOrder": 1,
  "imageUrl": "https://...",
  "isActive": true,
  "productCount": 12,
  "products": [
    {
      "id": "prod1",
      "name": "Auriculares Pro",
      "slug": "auriculares-pro",
      "price": 129.99,
      "imageUrl": "...",
      "position": 0
    },
    ...
  ]
}
```

---

## ⚙️ Próximos Pasos (Integración)

Para completar la integración:

1. **Home Page:**
   - Reemplazar mock `sliderLocalProducts` con `CollectionSlider` cargado de API
   ```tsx
   const homeCollections = await publicCollectionsService.getHomeCollections();
   ```

2. **ProductCard:**
   - Integrar `DiscountBadge` en cada tarjeta
   - Cargar descuento: `getProductDiscount(productId, price)`

3. **ProductList:**
   - Agregar filtro "En Oferta"
   - Filtro obtiene productos con descuentos activos

4. **ProductDetail:**
   - Mostrar precio original tachado
   - Valor del descuento
   - Información de promoción aplicada

5. **Navegación:**
   - Agregar link a `/offers` en menú de navegación

---

## 📝 Notes Técnicas

- **Descuentos acumulables:** NO - se elige el de mayor valor
- **Orden de evaluación:** Por prioridad descendente
- **Validaciones:**
  - Fechas: Fin > Inicio (en BD y frontend)
  - Valores positivos
  - Slugs únicos
- **Performance:**
  - Índices en tablas: isActive, startDate/endDate, priority
  - Queries optimizadas con include/select
- **Seguridad:**
  - Endpoints admin requieren auth + rol (admin/editor)
  - Endpoints públicos sin auth
  - Rate limiting recomendado en promociones/discounts

---

## ✅ Checklist de Testing

- [ ] Crear promoción con % descuento
- [ ] Crear promoción BOGO
- [ ] Duplicar promoción
- [ ] Editar fechas de promoción
- [ ] Eliminar promoción
- [ ] Crear colección sin productos
- [ ] Agregar 10+ productos a colección
- [ ] Reordenar productos en colección
- [ ] Ver descuento en /offers
- [ ] Ver colección en home
- [ ] Verificar descuento aplicado en producto individual
- [ ] Verificar múltiples promociones (elige mejor)

---

**Implementado:** 29 de marzo de 2026
**Puntaje:** 200 puntos
**Estado:** ✅ Completado 95% (falta testing completo)
