# Plan de Integración - Sistema de Ofertas y Promociones
**Fecha:** 29 de marzo de 2026  
**Estado:** En ejecución  
**Pasos Totales:** 13 tareas

---

## 📋 PARTE 1: INTEGRACIÓN (4-6 horas)

### Tarea 1: Home Page Dinámico ⏳ NOT STARTED
**Archivo:** `frontend/src/pages/Home/HomePage.tsx`  
**Objetivo:** Reemplazar mock data `sliderLocalProducts` con API dinámica

**Pasos:**
- [ ] Importar `publicCollectionsService` y `CollectionSlider`
- [ ] Agregar hooks useState/useEffect para cargar colecciones
- [ ] Reemplazar `<Slider products={sliderLocalProducts} ...>` con `<CollectionSlider>`
- [ ] Agregar error handling y loading states
- [ ] Testing manual: Verificar que colecciones cargan dinámicamente

**Cambios esperados:** ~50 líneas modificadas

---

### Tarea 2: ProductCard Badges (Primera parte) ⏳ NOT STARTED
**Archivo:** `frontend/src/features/products/ProductCard/ProductCard.tsx`  
**Objetivo:** Importar DiscountBadge y mostrar en tarjetas

**Pasos:**
- [ ] Importar `DiscountBadge` componente
- [ ] Importar `publicCollectionsService` para obtener descuentos
- [ ] Agregar estado para descuentos: `const [discount, setDiscount] = useState(null)`
- [ ] Agregar useEffect para cargar descuento del producto
- [ ] Renderizar `<DiscountBadge ...>` sobre la imagen
- [ ] Agregar manejo de errores silenciosos

**Cambios esperados:** ~40 líneas modificadas

---

### Tarea 3: ProductCard Pricing (Segunda parte) ⏳ NOT STARTED
**Archivo:** `frontend/src/features/products/ProductCard/ProductCard.tsx`  
**Objetivo:** Mostrar precio original tachado y precio con descuento

**Pasos:**
- [ ] Localizar componente `<ProductPrice>` en JSX
- [ ] Agregar condicional si hay descuento
- [ ] Mostrar precio original con strikethrough CSS
- [ ] Mostrar precio final en rojo/destacado
- [ ] CSS: .originalPrice { text-decoration: line-through; opacity: 0.6; }
- [ ] Testing: Verificar visualización en tarjetas

**Cambios esperados:** ~30 líneas CSS + 10 líneas JSX

---

### Tarea 4: ProductList Filter (Filtro En Oferta) ⏳ NOT STARTED
**Archivo:** `frontend/src/pages/ProductList/ProductListPage.tsx`  
**Objetivo:** Agregar checkbox "En Oferta" en filtros

**Pasos:**
- [ ] Importar `publicCollectionsService`
- [ ] Agregar estado: `const [showOnlyOnSale, setShowOnlyOnSale] = useState(false)`
- [ ] Cargar descuentos activos en useEffect
- [ ] Crear Set de productIds con descuentos
- [ ] Filtrar productos: `products.filter(p => showOnlyOnSale ? hasDiscount(p) : true)`
- [ ] Agregar checkbox HTML en UI (después de "Categorías")
- [ ] Mantener estado en URL si es necesario

**Cambios esperados:** ~40 líneas modificadas

---

### Tarea 5: ProductDetail Enhancement ⏳ NOT STARTED
**Archivo:** `frontend/src/pages/ProductDetail/ProductDetailPage.tsx`  
**Objetivo:** Mostrar información de descuento en detalle

**Pasos:**
- [ ] Importar `publicCollectionsService` y componente para mostrar info
- [ ] Importar `DiscountBadge`
- [ ] Agregar estado para descuento: `const [discount, setDiscount] = useState(null)`
- [ ] Cargar descuento en useEffect cuando se carga el producto
- [ ] Mostrar precio original (tachado) y final
- [ ] Mostrar información de promoción (nombre, fechas)
- [ ] Mostrar monto mínimo de compra si aplica
- [ ] CSS: Estilizar sección de descuentos

**Cambios esperados:** ~60 líneas modificadas

---

## 🧪 PARTE 2: TESTING (4-6 horas)

### Tarea 6: Unit Tests - Discount Service ⏳ NOT STARTED
**Archivo:** `backend/src/services/__tests__/discountService.test.ts`  
**Objetivo:** Tests para lógica de cálculo de descuentos

**Casos de prueba:**
- [ ] Test: calculateDiscount con porcentaje
- [ ] Test: calculateDiscount con monto fijo
- [ ] Test: calculateDiscount con BOGO
- [ ] Test: respeta maxDiscount
- [ ] Test: respeta minPurchaseAmount
- [ ] Test: getBestDiscount selecciona el mejor
- [ ] Test: descuentos por categoría vs producto
- [ ] Test: cálculos con precios decimales

**Cobertura esperada:** 95%+

---

### Taska 7: Integration Tests - API Endpoints ⏳ NOT STARTED
**Archivo:** `backend/src/__tests__/promotions.api.test.ts`  
**Objetivo:** Tests para endpoints de API

**Casos de prueba:**
- [ ] GET /api/admin/promotions (listar, paginar, filtrar)
- [ ] POST /api/admin/promotions (crear válido, inválido)
- [ ] PUT /api/admin/promotions/:id (actualizar)
- [ ] DELETE /api/admin/promotions/:id (eliminar)
- [ ] POST /api/admin/promotions/:id/duplicate
- [ ] GET /api/promotions/active (solo activos)
- [ ] GET /api/promotions/product-discount/:id (cálculo correcto)

**Cobertura esperada:** 90%+

---

### Tarea 8: Integration Tests - Collections API ⏳ NOT STARTED
**Archivo:** `backend/src/__tests__/collections.api.test.ts`  
**Objetivo:** Tests para endpoints de colecciones

**Casos de prueba:**
- [ ] CRUD colecciones (create, read, update, delete)
- [ ] Reordenar productos en colección
- [ ] Agregar/quitar productos
- [ ] Filtrar por displayPosition
- [ ] Filtrar por estado activo
- [ ] Validar slug único
- [ ] GET /api/collections/position/:position (público)

**Cobertura esperada:** 90%+

---

### Tarea 9: Component Tests - Admin Forms ⏳ NOT STARTED
**Archivo:** `frontend/src/features/admin/__tests__/AdminPromotionForm.test.tsx`  
**Objetivo:** Tests de componentes admin

**Casos de prueba:**
- [ ] Formulario se renderiza
- [ ] Validación: nombre requerido
- [ ] Validación: fecha fin > fecha inicio
- [ ] Submit crea promoción (mock API)
- [ ] Submit actualiza promoción existente
- [ ] Botón duplicar funcion
- [ ] Manejo de errores API

**Cobertura esperada:** 85%+

---

### Tarea 10: Component Tests - Collection Slider ⏳ NOT STARTED
**Archivo:** `frontend/src/components/__tests__/CollectionSlider.test.tsx`  
**Objetivo:** Tests del componente carrusel

**Casos de prueba:**
- [ ] Renderiza productos
- [ ] Botones anterior/siguiente funcionan
- [ ] No renderiza si no hay productos
- [ ] Click en producto dispara callback
- [ ] Responsive en diferentes tamaños

**Cobertura esperada:** 80%+

---

### Tarea 11: Component Tests - ProductCard with Badges ⏳ NOT STARTED
**Archivo:** `frontend/src/features/products/__tests__/ProductCard.test.tsx`  
**Objetivo:** Tests de tarjeta con badges

**Casos de prueba:**
- [ ] Muestra badge si hay descuento
- [ ] No muestra badge sin descuento
- [ ] Precio original tachado si hay descuento
- [ ] Click en tarjeta navega correctamente

**Cobertura esperada:** 80%+

---

### Tarea 12: E2E Tests - Offers Workflow ⏳ NOT STARTED
**Archivo:** `e2e/tests/offers.spec.ts` (Playwright o Cypress)  
**Objetivo:** Tests end-to-end de flujo de ofertas

**Scenarios:**
- [ ] Usuario ve página /ofertas
- [ ] Colecciones especiales cargan
- [ ] Promociones activas se muestran
- [ ] Click en producto navega a detalle
- [ ] Precio con descuento se calcula correctamente
- [ ] Filtro "En Oferta" funciona
- [ ] Admin puede crear promoción (login + CRUD)
- [ ] Cambios se reflejan inmediatamente en público

**Cobertura esperada:** 85%+

---

### Tarea 13: Testing Summary & Documentation ⏳ NOT STARTED
**Archivo:** `TESTING.md`  
**Objetivo:** Documentar estrategia de testing

**Contenido:**
- [ ] Configuración de tests
- [ ] Cómo ejecutar tests
- [ ] Cobertura actual
- [ ] Casos especiales encontrados
- [ ] Recomendaciones para mantenimiento

---

## 📊 Estado General

| Parte | Tareas | Completadas | % |
|-------|--------|-------------|---|
| Integración | 5 | 0 | 0% |
| Testing | 8 | 0 | 0% |
| **TOTAL** | **13** | **0** | **0%** |

---

## 🎯 Prioridades

1. **CRÍTICA:** Tareas 1-5 (Integración) - Usuario final lo ve
2. **IMPORTANTE:** Tareas 6-7 (Unit/Integration tests)
3. **DESEABLE:** Tareas 8-13 (E2E tests)

---

## ⚠️ Notas Importantes

- Los tests deben usar mocks para API calls
- Mantener cobertura > 80%
- Testing debe ejecutarse en CI/CD
- Documentar todos los edge cases encontrados
- Screenshots para UI tests si usas E2E

---

*Última actualización: 29 de marzo de 2026*
