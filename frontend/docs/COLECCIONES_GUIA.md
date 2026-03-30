# 📚 Guía: Gestión de Colecciones y Promociones

## ¿Qué son las Colecciones?

Las colecciones son **agrupaciones dinámicas de productos** que se muestran en diferentes partes del ecommerce. Por ejemplo: "Ofertas del Mes", "Productos Destacados", "Nuevas Llegadas", etc.

### Características principales:
- ✅ Se crean desde el admin (`/admin/colecciones`)
- ✅ Se pueden mostrar en la home o categorías específicas
- ✅ Se ordenan automáticamente en el frontend
- ✅ Requieren mínimo 1 producto para aparecer
- ✅ Deben estar "Activas" para ser visibles

---

## 🔧 Cómo crear una colección

### Paso 1: Ir al admin de colecciones
1. Ve a http://localhost:5174/admin/colecciones
2. Haz click en el botón **"+ Nueva Colección"**

### Paso 2: Llenar el formulario

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Nombre** * | Nombre de la colección | "Ofertas del Mes" |
| **Slug** * | URL amigable (auto-generado) | "ofertas-del-mes" |
| **Descripción** | Texto descriptivo (opcional) | "Nuestras mejores ofertas..." |
| **Posición de Display** * | Home o Categoría | Home |
| **Orden de Display** | Número (menor = primero) | 1 |
| **URL de Imagen** | Banner/imagen de la colección | https://example.com/image.jpg |
| **Productos en esta colección** | Busca y agrega productos | Ver Paso 3 |
| **Activo** | Checkbox para activar/desactivar | ☑ |

### Paso 3: Agregar productos

1. **Busca productos** en el campo "Productos en esta colección"
   - Escribe al menos 3 caracteres
   - El sistema busca por nombre, SKU o descripción
   
2. **Haz click** en un producto de la lista desplegable
   - Se agregará a la lista de productos de la colección
   - El campo de búsqueda se vaciará

3. **Gestiona los productos agregados**
   - Los productos aparecen con su ID
   - Haz click en **"Eliminar"** para quitar un producto

4. **Para cambiar el orden**
   - (Próxima feature) Por ahora se ordena por orden de inserción

### Paso 4: Guardar

1. Haz click en **"Crear"** para crear una nueva colección
2. O haz click en **"Actualizar"** para editar una existente
3. Si hay errores, verás un mensaje rojo

---

## 📝 Ejemplo práctico

### Crear "Ofertas del Mes"

```
Nombre:                 Ofertas del Mes
Slug:                   ofertas-del-mes (auto-generado)
Descripción:            Nuestras mejores ofertas del mes - ¡No te las pierdas!
Posición de Display:    Home
Orden de Display:       1
URL de Imagen:          [URL de una imagen atractiva]
Productos:
  - Batería De Cocina Hudson 5 Piezas
  - Set Completo Baño
  - Vaso Capuchino

Activo:                 ☑ (marcado)
```

Luego de guardar, la colección aparecerá en http://localhost:5174 en la sección "Ofertas del Mes".

---

## ❓ Preguntas frecuentes

### P: ¿Por qué no veo la colección en el home?

**R:** Verifica:
- ✅ La colección tiene al menos 1 producto asignado
- ✅ La colección está **Activa** (checkbox marcado)
- ✅ La **Posición de Display** es **"Home"**
- ✅ Has guardado los cambios
- ✅ El navegador está actualizado (presiona F5)

### P: ¿Cómo cambio el orden de los productos dentro de una colección?

**R:** Actualmente se muestra en el orden que los agregaste. Próximamente habrá drag-and-drop para reordenarlos.

### P: ¿Puedo un producto en varias colecciones?

**R:** Sí, un producto puede estar en múltiples colecciones sin problemas.

### P: ¿Diferencia entre colecciones y promociones?

| Aspecto | Colecciones | Promociones |
|---------|------------|------------|
| **Qué es** | Agrupación de productos | Descuento/Oferta |
| **Dónde aparece** | Secciones del home | Badge en el producto |
| **Ejemplos** | "Nuevas Llegadas", "Bestsellers" | "10% descuento", "Compra 2 lleva 3" |
| **Origen** | Admin de colecciones | Admin de promociones |

---

## 🚀 Próximas features

- [ ] Drag-and-drop para reordenar productos
- [ ] Editor visual para imágenes de colecciones
- [ ] Búsqueda avanzada de productos (por categoría, precio)
- [ ] Vista previa en el admin
- [ ] Historial de cambios

---

## 🐛 Si algo falla

1. Abre la consola del navegador (**F12**)
2. Busca mensajes de error rojo
3. Verifica que el backend esté corriendo: `npm run dev` en `/backend`
4. Recarga la página (F5)

¡Listo! Ahora puedes crear colecciones dinámicas. 🎉
