# 📦 Guía de Recursos - AllMart Frontend

Documento completo sobre la gestión de recursos, flujo de trabajo, optimización y mejores prácticas para el desarrollo frontend de AllMart.

---

## 📑 Tabla de Contenidos

1. [Estructura de Recursos](#estructura-de-recursos)
2. [Flujo de Trabajo](#flujo-de-trabajo)
3. [Tips de Optimización](#tips-de-optimización)
4. [Recomendaciones para Futuros Assets](#recomendaciones-para-futuros-assets)
5. [Herramientas y Tecnologías](#herramientas-y-tecnologías)
6. [Troubleshooting](#troubleshooting)

---

## 🗂️ Estructura de Recursos

### Ubicación Principal

```
frontend/src/
├── assets/              # 🎨 Todos los recursos visuales
│   └── images/
│       ├── featured/    # 🌟 Carruseles, banners, promociones
│       ├── logos/       # 🏢 Logos e iconos de marca
│       │   └── favicon_io/
│       └── products/    # 📦 Imágenes de productos por categoría
│           ├── baño/
│           └── cocina/
├── components/          # ⚛️ Componentes React reutilizables
├── context/             # 🔄 Context API para estado global
├── data/                # 📊 Datos estáticos y configuración
├── features/            # 🎯 Modelos de negocio por dominio
├── pages/               # 📄 Páginas principales de la aplicación
├── styles/              # 🎨 Estilos CSS y temas globales
├── types/               # 📝 Definiciones TypeScript
└── utils/               # 🛠️ Funciones utilitarias y helpers
```

### Desglose Detallado por Carpeta

#### 📦 `/assets/images`

| Carpeta | Contenido | Formato | Ejemplos |
|---------|----------|---------|----------|
| **featured/** | Imágenes destacadas para carruseles y banners | `.jpg`, `.jpeg` | `setcompletobaño.jpg`, `vasocapuchino.jpg` |
| **logos/** | Logo principal de la marca | `.jpeg` | `logo-allmart.jpeg` |
| **logos/favicon_io/** | Iconos favicon en múltiples tamaños | `.png`, `.ico` | `favicon-16x16.png`, `apple-touch-icon.png` |
| **products/baño/** | Productos de la categoría baño | `.png` | `set-de-baño-blanco.png`, `tacho-blanco-redondo.png` |
| **products/cocina/** | Productos de la categoría cocina | `.png` | `bateria-hudson-negra.png`, `set-24-cubiertos1.png` |

#### ⚛️ Carpetas de Código

```
components/    → Componentes visuales (Header, Footer, Cards, etc.)
context/       → Estado global (AuthContext, CartContext, etc.)
data/          → Configuraciones, constantes y datos estáticos
features/      → Lógica de negocio separada por dominio
pages/         → Páginas principales (Home, Productos, Checkout, etc.)
styles/        → CSS global, variables de tema, reset de estilos
types/         → Interfaces y tipos TypeScript compartidos
utils/         → Funciones auxiliares, formatters, helpers
```

---

## 🔄 Flujo de Trabajo

### 1️⃣ Descubrir Recursos Existentes

#### Opción A: Por Tipo de Recurso

```bash
# 📸 Verificar todas las imágenes disponibles
ls -la frontend/src/assets/images/

# 🏢 Ver logos
ls -la frontend/src/assets/images/logos/

# 📦 Ver productos de cocina
ls -la frontend/src/assets/images/products/cocina/

# 🌟 Ver imágenes destacadas
ls -la frontend/src/assets/images/featured/
```

#### Opción B: Por Categoría de Producto

```bash
# Baño
ls -la frontend/src/assets/images/products/baño/

# Cocina (la más completa)
ls -la frontend/src/assets/images/products/cocina/
```

#### Opción C: Buscar por Nombre de Archivo

```bash
# 🔍 Buscar todas las imágenes de una marca o tipo
find frontend/src/assets/images/ -name "*hudson*"
find frontend/src/assets/images/ -name "*baño*"
find frontend/src/assets/images/ -name "*cubiertos*"
```

### 2️⃣ Usar Recursos en Componentes

#### Importar Imágenes (React)

```tsx
// ✅ Forma correcta: Importar dinámicamente
import productImage from '@/assets/images/products/cocina/bateria-hudson-negra.png'

export function ProductCard() {
  return (
    <img 
      src={productImage} 
      alt="Batería Hudson negra"
      loading="lazy"
    />
  )
}
```

#### Rutas Relativas vs Alias

```tsx
// ❌ Evitar rutas relativas largas
import img from '../../../assets/images/products/cocina/product.png'

// ✅ Usar alias (revisar tsconfig.json)
import img from '@/assets/images/products/cocina/product.png'

// ✅ Alternativa: path absoluto desde public/
<img src="/images/products/cocina/bateria-hudson-negra.png" alt="..." />
```

### 3️⃣ Agregar Nuevos Recursos

#### A: Agregar Imagen de Producto

```bash
# 1. Ubicar la carpeta correcta (por categoría)
cd frontend/src/assets/images/products/cocina/

# 2. Optimizar la imagen (ver sección optimización)
# 3. Colocar el archivo con nombre en minúsculas
# 4. Usar en componentes con import o ruta absolute
```

**Checklist:**
- [ ] Archivo en minúsculas y con guiones: `nombre-descriptivo.png`
- [ ] Peso menor a 200KB
- [ ] Formato: `.png` para productos (soporta transparencia), `.jpg` para featured
- [ ] Dimensiones apropiadas (96x96 mín, 800x800 máx recomendado)
- [ ] Alt text descriptivo

#### B: Agregar Imagen Destacada

```bash
# 1. Navegar a la carpeta featured
cd frontend/src/assets/images/featured/

# 2. Agregar imagen con convención de nombres
# 3. Usar en carruseles o banners
```

**Checklist especial:**
- [ ] Peso menor a 500KB (formato `.jpg` recomendado)
- [ ] Dimensión recomendada: 1200x600px o similar (16:9)
- [ ] Optimizada para web
- [ ] Sin textos críticos cerca de los bordes (responsive)

#### C: Agregar Logo o Favicon

```bash
# 1. Logos principales
frontend/src/assets/images/logos/logo-allmart.jpeg

# 2. Favicons (múltiples tamaños)
frontend/src/assets/images/logos/favicon_io/
```

**Para favicons multireso:**
```
favicon-16x16.png
favicon-32x32.png
apple-touch-icon.png
android-chrome-192x192.png
android-chrome-512x512.png
favicon.ico
```

---

## ⚡ Tips de Optimización

### 🖼️ Optimización de Imágenes

#### 1. Formatos Recomendados

| Caso de Uso | Formato | Ventajas | Peso Típico |
|----------|---------|----------|-----------|
| **Productos** | `.png` | Transparencia, lossless quality | 80-200KB |
| **Destacadas** | `.jpg`/`.jpeg` | Excelente compresión color | 100-300KB |
| **Logos** | `.svg` (si es de marca) | Infinita escalabilidad | <50KB |
| **Favicon** | `.ico` + `.png` | Compatibilidad universal | <20KB |
| **Progressive** | `.webp` | Máxima compresión moderna | 60-150KB |

#### 2. Herramientas de Compresión

```bash
# 🐧 Linux - ImageMagick
convert input.jpg -quality 85 -strip output.jpg

# 🐳 Usar Docker con herramienta optimizadora
docker run -it --rm -v $(pwd):/img minimalman/imagemagick

# 🌐 En línea (rápido para pruebas)
# https://tinypng.com
# https://squoosh.app
```

#### 3. Tamaños Máximos Recomendados

```
Productos: 200KB máximo
Destacadas: 350KB máximo
Logo: 50KB máximo
Favicon: 20KB máximo

Total assets/images: <5MB recomendado
```

#### 4. Dimensiones de Imagen Ideales

```
Productos:      400px × 400px
Destacadas:    1200px × 600px (16:9)
Favicon:       512px × 512px (máximo)
Logo:          300px × 100px (aproximado)
Thumbnails:    150px × 150px
```

### ⚛️ Optimización en React

#### 1. Lazy Loading (Carga Perezosa)

```tsx
// ✅ Cargar imágenes solo cuando entran en viewport
<img 
  src={imagePath}
  alt="Descripción"
  loading="lazy"  // Carga diferida automática
/>

// ✅ Con Intersection Observer para más control
import { useEffect, useRef } from 'react'

function LazyImage({ src, alt }) {
  const imgRef = useRef(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && imgRef.current) {
          imgRef.current.src = src
          observer.unobserve(imgRef.current)
        }
      })
    })
    
    if (imgRef.current) observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [src])
  
  return <img ref={imgRef} alt={alt} />
}
```

#### 2. Responsive Images

```tsx
// ✅ Usar srcset para diferentes dispositivos
<img
  src="/images/products/cocina/bateria-hudson-negra.png"
  srcSet="
    /images/products/cocina/bateria-hudson-negra-small.png 400w,
    /images/products/cocina/bateria-hudson-negra.png 800w
  "
  sizes="(max-width: 600px) 100vw, 50vw"
  alt="Batería Hudson"
/>
```

#### 3. Optimizar Imports en TypeScript

```tsx
// ✅ Importar solo lo necesario
import logoAlt from '@/assets/images/logos/logo-allmart.jpeg'

// ❌ Evitar imports innecesarios
import * as images from '@/assets/images'
```

### 🚀 Optimización de Build (Vite)

#### 1. Configuración de Vite (vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // Optimizar imágenes en build
  build: {
    rollupOptions: {
      output: {
        // 📦 Agrupar chunks por tamaño
        manualChunks: {
          'third-parties': ['react', 'react-dom'],
        }
      }
    },
    
    // Configurar minificación
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true  // Remover console en prod
      }
    },
    
    // Límite para inline assets
    assetsInlineLimit: 8192  // 8KB - cambiar según necesite
  },
  
  // Alias para path absoluto
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
```

#### 2. Build Optimization en package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",  // TypeScript check + build
    "build:analyze": "vite build --outDir dist --reportCompressedSize",
    "preview": "vite preview"
  }
}
```

### 🎨 Optimización CSS

```css
/* ✅ Usar variables CSS para reutilizar colores y valores */
:root {
  --color-primary: #006241;
  --color-secondary: #f5f5f5;
  --spacing-base: 1rem;
  --transition-default: 0.3s ease;
}

/* ✅ Combinar selectores para menor CSS puro */
.btn, .btn-primary, .btn-secondary {
  padding: var(--spacing-base);
  transition: all var(--transition-default);
}

/* ❌ Evitar especificidad innecesaria */
div.container .card p.text { }

/* ✅ Usar clases simples */
.card-text { }
```

---

## 📋 Recomendaciones para Futuros Assets

### ✅ Checklist Antes de Agregar un Nuevo Asset

```
Antes de commitar un nuevo recurso:

□ Nombre en minúsculas con guiones: product-name.png
□ Imagen optimizada (<200KB para productos, <350KB para featured)
□ Formato adecuado (.png para productos, .jpg para featured)
□ Dimensiones apropiadas (400x400 mín para productos)
□ Sin espacios en blanco excesivos
□ Alt text descriptivo preparado
□ Ubicado en carpeta correcta (/products/categoría/)
□ Testeado en múltiples resoluciones (desktop, tablet, mobile)
□ Documentado en IMAGES.md si es un recurso especial
```

### 🎯 Convenciones de Nombres

#### Patrón de Nombres

```
[tipo]-[marca]-[modelo][-variante].[extensión]

Ejemplos:
✅ bateria-hudson-negra.png
✅ set-24-cubiertos-carol.png
✅ tacho-blanco-cuadrado.png
✅ vasocapuchino.jpg
✅ logo-allmart.jpeg

❌ bateria_hudson_negra.png (usar guiones, no guiones bajos)
❌ Bateria-Hudson.png (usar minúsculas)
❌ bateria hudson negra.png (sin espacios)
```

#### Reglas Clave

1. **Minúsculas obligatorias**: Todos los nombres en lowercase
2. **Separadores**: Usar guiones `-` para separar palabras
3. **Sin espacios**: Nunca include espacios
4. **Descriptivo**: Incluir marca, color, modelo cuando sea relevante
5. **Único**: Nombres sin duplicados en la misma categoría

### 📐 Dimensiones Recomendadas

```
┌─────────────────────────────────────────────────┐
│ TIPOS DE IMAGEN Y DIMENSIONES IDEALES           │
├─────────────────────────────────────────────────┤
│                                                 │
│ Productos (cuadrado):                           │
│   Mínimo:  200px × 200px                        │
│   Ideal:   400px × 400px                        │
│   Máximo:  800px × 800px                        │
│                                                 │
│ Destacadas (panorama 16:9):                     │
│   Mínimo:  800px × 450px                        │
│   Ideal:   1200px × 675px                       │
│   Máximo:  1920px × 1080px                      │
│                                                 │
│ Favicon (cuadrado):                             │
│   Mínimo:  16px × 16px                          │
│   Ideal:   512px × 512px                        │
│   Máximo:  512px × 512px                        │
│                                                 │
│ Logo (paisaje o vertical):                      │
│   Ancho mínimo: 200px                           │
│   Altura máxima: 100px (aprox)                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 💾 Compresión Recomendada

#### Por Tipo de Archivo

| Tipo | Herramienta | Comando | Reducción |
|------|-----------|---------|-----------|
| PNG | PNGquant | `pngquant --speed 1 image.png` | 50-80% |
| JPEG | mozjpeg | `cjpeg -quality 85 input.jpg` | 20-40% |
| WebP | cwebp | `cwebp input.png -o output.webp` | 60-80% |
| Batch | ImageMagick | `mogrify -quality 85 *.jpg` | Varía |

#### Herramientas en Línea (Solo para Pruebas)

- [TinyPNG](https://tinypng.com) - PNG/JPG inteligente
- [Squoosh](https://squoosh.app) - Comparador múltiples formatos
- [Optimizilla](https://imagecompressor.com) - Compresión visual

### 🏗️ Estructura de Categorías

Al agregar una nueva categoría de productos:

```bash
# 1. Crear carpeta en products/
mkdir frontend/src/assets/images/products/nueva-categoria/

# 2. Colocar imágenes siguiendo convención
frontend/src/assets/images/products/nueva-categoria/
  ├── producto-1-variante-a.png
  ├── producto-1-variante-b.png
  └── producto-2.png

# 3. Actualizar IMAGES.md con nueva categoría
# 4. Documentar en estructura del proyecto
```

### 🔍 Control de Calidad

Antes de considerar un asset "listo para producción":

```
✅ Visual:
   - Imagen nítida sin distorsiones
   - Colores consistentes
   - Sin artefactos de compresión visibles
   - Fondo transparente (si es PNG) o blanco (si es JPG)

✅ Técnico:
   - Metadatos EXIF removidos (privacidad)
   - Tamaño <200KB para productos, <350KB para featured
   - Resolución mínima 200x200 para productos
   - Sin enlazado externo

✅ Usabilidad:
   - Alt text útil y descriptivo
   - Nombre de archivo en inglés o español consistente
   - Compatible en navegadores antiguos (IE11 si es legacy)
   - Testado en mobile
```

---

## 🛠️ Herramientas y Tecnologías

### Stack Frontend Actual

```json
{
  "Framework": "React 19.2.0",
  "Build Tool": "Vite 7.3.1",
  "Language": "TypeScript 5.9.3",
  "Routing": "React Router 7.13.0",
  "Icons": "Lucide React 0.564.0",
  "Charts": "Recharts 3.7.0",
  "Environment": "dotenv 17.3.1",
  "Linter": "ESLint 9.39.1"
}
```

### Comandos Útiles

```bash
# 🚀 Desarrollo
npm run dev              # Iniciar servidor Vite en dev

# 🔨 Build
npm run build            # TypeScript check + Vite build
npm run preview          # Preview de build en local

# 🔍 Debugging
npm run lint             # Revisar código con ESLint

# 📊 Análisis
npm run build -- --outDir dist --reportCompressedSize
                        # Reporte detallado de tamaño de bundle
```

---

## 🚨 Troubleshooting

### Problema: Imagen no carga en producción

**Causas comunes:**
```
1. Ruta relativa incorrecta (usa alias @/ o /images)
2. Archivo con mayúsculas (renombrar a minúsculas)
3. Extensión incorrecta (.jpg en lugar de .jpeg)
4. Ruta en import no existe
```

**Solución:**
```tsx
// ❌ Incorrecto
import img from '../../../assets/images/Product.png'

// ✅ Correcto
import img from '@/assets/images/products/cocina/product-name.png'

// ✅ O usar ruta absoluta
<img src="/images/products/cocina/product-name.png" />
```

---

### Problema: Imagen muy lenta en cargar

**Causas:**
```
1. Archivo no optimizado (>200KB)
2. Dimensión muy grande (5000x5000px)
3. No hay lazy loading implementado
4. Múltiples imágenes sin srcset responsivo
```

**Solución (por prioridad):**

1. **Comprimir** con ImageMagick o TinyPNG
2. **Redimensionar** a máximo 800x800px
3. **Agregar lazy loading** al HTML
4. **Usar formato WebP** como fallback

```tsx
<picture>
  <source srcSet="/image.webp" type="image/webp" />
  <img 
    src="/image.jpg" 
    alt="..."
    loading="lazy"
  />
</picture>
```

---

### Problema: Asset no se refleja después de actualizar

**Causas:**
```
1. Caché del navegador (Ctrl+Shift+Delete)
2. Caché de Vite (borrar .vite/)
3. Path incorrecta en componente
4. Archivo con nombre duplicado
```

**Solución:**
```bash
# Limpiar caché de Vite
rm -rf frontend/node_modules/.vite

# Hard refresh en navegador
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# O borrar caché en DevTools
DevTools > Application > Cache Storage
```

---

### Problema: Import o export inválido

**Error típico:**
```
[vite] Failed to import module. Check the web console for details.
```

**Verificar:**
```tsx
// ❌ Incorrecto - falta extensión
import img from '@/assets/images/products/cocina/producto'

// ✅ Correcto - con extensión
import img from '@/assets/images/products/cocina/producto.png'

// ❌ Incorrecto - mayúscula en nombre
import img from '@/assets/images/products/cocina/Producto.png'

// ✅ Correcto - minúsculas
import img from '@/assets/images/products/cocina/producto.png'
```

---

## 📚 Referencias Útiles

### Documentación Relacionada

- **[IMAGES.md](../IMAGES.md)** - Tabla completa de imágenes existentes
- **[package.json](../package.json)** - Dependencias y scripts disponibles
- **[vite.config.ts](../vite.config.ts)** - Configuración de build
- **[README.md](../README.md)** - Overview del frontend

### Enlaces Externos

- [Vite Documentation](https://vitejs.dev/) - Build tool
- [React Documentation](https://react.dev/) - Framework
- [Image Optimization Guide](https://web.dev/optimize-images/) - Web.dev
- [WebP Format](https://developers.google.com/speed/webp) - Formato moderno

---

## 🎓 Flujo Rápido para Nuevos Devs

### Setup Inicial

```bash
# 1. Clonar proyecto
git clone <repo-url>
cd allmart/frontend

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Navegar a http://localhost:5173
```

### Agregar Primera Imagen

```bash
# 1. Optimizar imagen (máximo 200KB)
# Usar TinyPNG o ImageMagick

# 2. Copiar a carpeta correcta
cp bateria-hudson-negra.png src/assets/images/products/cocina/

# 3. Importar en componente
import productImg from '@/assets/images/products/cocina/bateria-hudson-negra.png'

# 4. Usar en JSX
<img src={productImg} alt="Batería Hudson negra" loading="lazy" />

# 5. Commit
git add .
git commit -m "feat: add bateria-hudson-negra product image"
```

---

**Última actualización:** 5 de marzo de 2026  
**Mantenedor:** Frontend Team  
**Status:** ✅ En uso
