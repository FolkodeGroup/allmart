# Plan de Integración del Sistema de Ofertas y Promociones

## 📌 Estado Actual
- ✅ **Backend:** 100% completo (services, controllers, routes)
- ✅ **Prisma:** Migración aplicada exitosamente
- ✅ **Frontend Admin:** 100% completo (CRUD de promociones y colecciones)
- ✅ **Frontend Public:** 90% completo (componentes creados pero falta integración)
- ⏳ **Testing:** No iniciado

---

## 🎯 Tareas Pendientes (Orden de Ejecución)

### Tarea 1: Integración Home Page [Priority: ALTA]

**Objetivo:** Reemplazar mock data con colecciones dinámicas

**Archivos a Modificar:**
- `frontend/src/pages/Home/Home.tsx` (o similar)
- `frontend/src/data/sliderLocalProducts.ts` (verificar existencia)

**Pasos:**

1. Importar servicio y componente:
```tsx
import { publicCollectionsService } from '@/services';
import { CollectionSlider } from '@/components';
```

2. Agregar estado para colecciones:
```tsx
const [homeCollections, setHomeCollections] = useState([]);
const [loading, setLoading] = useState(true);
```

3. En useEffect cargar colecciones:
```tsx
useEffect(() => {
  const fetchCollections = async () => {
    try {
      const data = await publicCollectionsService.getHomeCollections();
      setHomeCollections(data);
    } catch (error) {
      console.error('Error loading home collections:', error);
    } finally {
      setLoading(false);
    }
  };
  fetchCollections();
}, []);
```

4. Renderizar dinámicamente:
```tsx
{homeCollections.map((collection) => (
  <CollectionSlider
    key={collection.id}
    title={collection.name}
    description={collection.description}
    products={collection.products}
    bannerUrl={collection.imageUrl}
    onProductClick={(slug) => navigate(`/products/${slug}`)}
  />
))}
```

**Estimación:** 30 minutos
**Validación:** Cargar page home y ver colecciones dinámicas

---

### Tarea 2: Integración DiscountBadge en ProductCard [Priority: ALTA]

**Objetivo:** Mostrar badges de descuento en tarjetas de producto

**Archivos a Modificar:**
- `frontend/src/components/ProductCard.tsx` (o similar)
- Cualquier componente que renderice productos (ProductList, CategoryProducts, etc.)

**Pasos:**

1. En ProductCard, importar:
```tsx
import { DiscountBadge } from '@/components';
import { publicCollectionsService } from '@/services';
```

2. Agregar estado para descuento:
```tsx
const [discount, setDiscount] = useState(null);

useEffect(() => {
  const fetchDiscount = async () => {
    try {
      const result = await publicCollectionsService.getProductDiscount(
        product.id,
        product.price,
        product.categoryId
      );
      setDiscount(result);
    } catch (error) {
      console.error('Error loading discount:', error);
    }
  };
  fetchDiscount();
}, [product.id, product.price]);
```

3. Renderizar el badge:
```tsx
<div className={styles.productImageContainer}>
  <img src={product.imageUrl} alt={product.name} />
  {discount && (
    <DiscountBadge
      discountPercentage={discount.discountPercentage}
      originalPrice={discount.originalPrice}
      finalPrice={discount.finalPrice}
      promotionType={discount.promotionType}
    />
  )}
</div>
```

4. Mostrar descuento en precio:
```tsx
<div className={styles.priceContainer}>
  {discount ? (
    <>
      <span className={styles.originalPrice}>${product.price.toFixed(2)}</span>
      <span className={styles.finalPrice}>${discount.finalPrice.toFixed(2)}</span>
    </>
  ) : (
    <span className={styles.price}>${product.price.toFixed(2)}</span>
  )}
</div>
```

5. CSS para precio tachado:
```css
.originalPrice {
  text-decoration: line-through;
  color: #999;
  margin-right: 10px;
}

.finalPrice {
  color: #e63946;
  font-weight: bold;
  font-size: 1.1em;
}

.productImageContainer {
  position: relative;
  overflow: hidden;
}
```

**Locaciones a verificar:**
- ProductCard (componente base de producto)
- ProductList (listado de productos)
- CategoryProducts (productos en categoría)
- ProductDetail (página de detalle)
- SearchResults (resultados de búsqueda)
- CartItem (item en carrito)

**Estimación:** 1.5 horas (múltiples componentes)
**Validación:** Ver badges en productos con descuento, corroborar precios

---

### Tarea 3: Filtro "En Oferta" en ProductList [Priority: MEDIA]

**Objetivo:** Agregar filtro para mostrar solo productos en oferta

**Archivos a Modificar:**
- `frontend/src/pages/Products/ProductList.tsx` (o similar)

**Pasos:**

1. Cargar descuentos activos:
```tsx
const [activeDiscounts, setActiveDiscounts] = useState([]);

useEffect(() => {
  const fetchDiscounts = async () => {
    try {
      const discounts = await publicCollectionsService.getActiveDiscounts();
      setActiveDiscounts(discounts);
    } catch (error) {
      console.error('Error loading active discounts:', error);
    }
  };
  fetchDiscounts();
}, []);
```

2. Crear conjunto de IDs con descuento:
```tsx
const discountedProductIds = new Set(
  activeDiscounts.map(d => d.productId)
);
```

3. Agregar estado del filtro:
```tsx
const [showOnlyOnSale, setShowOnlyOnSale] = useState(false);
```

4. Aplicar filtro a productos:
```tsx
const filteredProducts = products.filter(product => {
  if (showOnlyOnSale && !discountedProductIds.has(product.id)) {
    return false;
  }
  // otros filtros...
  return true;
});
```

5. Agregar checkbox en UI:
```tsx
<div className={styles.filters}>
  <label>
    <input
      type="checkbox"
      checked={showOnlyOnSale}
      onChange={(e) => setShowOnlyOnSale(e.target.checked)}
    />
    Solo En Oferta
  </label>
  {/* otros filtros */}
</div>
```

**Estimación:** 45 minutos
**Validación:** Activar filtro y verificar que solo aparecen productos con descuento

---

### Tarea 4: Mostrar Precio Original en ProductDetail [Priority: MEDIA]

**Objetivo:** En página de detalle del producto, mostrar descuento y precio original

**Archivos a Modificar:**
- `frontend/src/pages/ProductDetail/ProductDetail.tsx` (o similar)

**Pasos:**

1. Cargar descuento en componente:
```tsx
const [discount, setDiscount] = useState(null);

useEffect(() => {
  const fetchDiscount = async () => {
    const result = await publicCollectionsService.getProductDiscount(
      productId,
      product.price,
      product.categoryId
    );
    setDiscount(result);
  };
  fetchDiscount();
}, [productId, product.price]);
```

2. Mostrar información detallada de descuento:
```tsx
<div className={styles.priceSection}>
  <h3>Precio</h3>
  {discount ? (
    <>
      <p className={styles.originalPrice}>
        Precio Original: ${product.price.toFixed(2)}
      </p>
      <p className={styles.discount}>
        Descuento: {discount.discountPercentage}% (${discount.discountAmount.toFixed(2)})
      </p>
      <p className={styles.finalPrice}>
        Precio Final: ${discount.finalPrice.toFixed(2)}
      </p>
      <p className={styles.promotionInfo}>
        Promoción válida hasta: {new Date(discount.endDate).toLocaleDateString('es-ES')}
      </p>
    </>
  ) : (
    <p className={styles.price}>${product.price.toFixed(2)}</p>
  )}
</div>
```

3. Agregar banner si está en oferta:
```tsx
{discount && (
  <div className={styles.offerBanner}>
    🎉 ¡Este producto está en oferta!
  </div>
)}
```

**Estimación:** 30 minutos
**Validación:** Ver información de descuento en producto con oferta

---

### Tarea 5: Navegación Hacia /ofertas [Priority: BAJA]

**Objetivo:** Agregar link al páginas de ofertas en menú

**Archivos a Modificar:**
- Header/Navigation component
- Menu principal

**Pasos:**

1. Agregar NavLink:
```tsx
import { NavLink } from 'react-router-dom';

<nav>
  <NavLink to="/products">Productos</NavLink>
  <NavLink to="/offers">Ofertas del Mes</NavLink>
  <NavLink to="/contact">Contacto</NavLink>
</nav>
```

2. Agregar ruta si no existe:
```tsx
// En App.tsx o rutas principales
<Route path="/offers" element={<Offers />} />
```

**Estimación:** 15 minutos

---

## ✅ Testing Requerido

### Pruebas Manual (Antes de Testing Automatizado)

```
[ ] ADMIN:
    [ ] Crear promoción tipo Porcentaje
    [ ] Crear promoción tipo Monto Fijo
    [ ] Crear promoción tipo BOGO
    [ ] Duplicar una promoción
    [ ] Editar fechas (validar interdependencia)
    [ ] Eliminar promoción (verificar cascada)
    [ ] Crear colección sin productos
    [ ] Agregar productos a colección (agregar/eliminar)
    [ ] Reordenar productos dentro de colección
    [ ] Filtrar por estado activo/inactivo
    [ ] Búsqueda por nombre

[ ] PUBLIC - HOME PAGE:
    [ ] Cargar página home
    [ ] Ver colecciones dinámicas (no mock)
    [ ] Hacer click en producto de colección
    [ ] Navegar a detalle correctamente

[ ] PUBLIC - PRODUCTOS:
    [ ] Ver badge de descuento en producto con oferta
    [ ] No ver badge en producto sin oferta
    [ ] Precio original tachado
    [ ] Precio nuevo destacado
    [ ] Filtro "En Oferta" activo/inactivo
    [ ] Descartar producto cuando se desactiva filtro

[ ] PUBLIC - DETALLE:
    [ ] Ver precio original
    [ ] Ver información de descuento
    [ ] Ver fecha de finalización
    [ ] Botón "Comprar" con precio correcto

[ ] PUBLIC - /OFERTAS:
    [ ] Cargar página sin errores
    [ ] Ver todas las colecciones especiales
    [ ] Ver todas las promociones activas
    [ ] Hacer click en producto navega a detalle
    [ ] Error handling si no hay conecciones
```

### Testing Automatizado (TODO)

```
backend/__tests__/:
  - discountService.test.ts (calculateDiscount, getBestDiscount)
  - promotions.api.test.ts (CRUD endpoints)
  - collections.api.test.ts (CRUD endpoints)

frontend/__tests__/:
  - AdminPromotions.test.tsx (tabla, paginación, CRUD)
  - AdminPromotionForm.test.tsx (validación fechas)
  - AdminCollections.test.tsx (tabla, filtros)
  - AdminCollectionForm.test.tsx (generación slug)
  - CollectionSlider.test.tsx (scroll, responsive)
  - DiscountBadge.test.tsx (formato correctos)
  - Offers.test.tsx (carga datos, renderizado)
```

---

## 🚀 Orden Recomendado de Ejecución

1. **Tarea 1:** Home Page Integration (30 min) - Más impactante
2. **Tarea 2:** ProductCard Badges (1.5 h) - Visible a usuarios
3. **Tarea 3:** Filter On Sale (45 min) - Complementa Tarea 2
4. **Tarea 4:** ProductDetail Discount (30 min) - Información completa
5. **Tarea 5:** Navigation (15 min) - Acceso final
6. **Testing Manual:** Validación (2-3 h) - Antes de automatizado
7. **Testing Automatizado:** Suite completa (4-6 h) - Solo si hay tiempo

**Tiempo Total Estimado:** 6-8 horas

---

## 🔍 Checklist Pre-Testing

- [ ] Backend compila sin errores (`npm run build`)
- [ ] Frontend compila sin errores (`npm run build`)
- [ ] Base de datos migrada correctamente
- [ ] API endpoints accesibles (verificar CORS)
- [ ] Variables de entorno configuradas
- [ ] Assets/imágenes disponibles
- [ ] Rutas react añadidas en App.tsx
- [ ] Componentes exportados en índices

---

## 📞 Contacto & Ayuda

Si necesitas ayuda durante la integración:

1. **Error de tipo TypeScript:** Verificar tipos en `services/`
2. **Error API 404:** Verificar rutas en `backend/src/routes/`
3. **Error de estilos:** Verificar ruta de imports de CSS Modules
4. **Error de datos:** Verificar que API devuelve datos esperados (usar DevTools Network)

---

**Documento creado:** 29 de marzo de 2026
**Estado general:** Feature 90% completado (solo integración restante)
