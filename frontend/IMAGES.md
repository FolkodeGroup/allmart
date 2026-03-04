# Estructura de Imágenes - AllMart

Este documento describe la organización de los activos de imágenes, convenciones de nombres y categorías utilizadas en el proyecto.

## Estructura de Carpetas

```
/src/assets/images/
├── featured/          # Imágenes destacadas para carruseles y promociones
├── logos/            # Logos de marca e iconos de favicon
│   ├── favicon_io/   # Íconos de favicon en diferentes tamaños
│   └── logo-allmart.jpeg
└── products/         # Imágenes de productos organizadas por categoría
    ├── baño/        # Productos de categoría baño
    └── cocina/      # Productos de categoría cocina
```

## Descripción de Carpetas

### `/featured`
Contiene imágenes de alto perfil utilizadas en carruseles, banners y secciones destacadas del sitio.

### `/logos`
Almacena todos los logos e iconos de marca de AllMart.

#### `/logos/favicon_io`
Íconos de favicon en múltiples formatos y resoluciones para diferentes dispositivos y navegadores.

### `/products`
Organiza las imágenes de productos según categorías de producto disponibles en el catálogo.

#### `/products/baño`
Imágenes de productos de la categoría baño.

#### `/products/cocina`
Imágenes de productos de la categoría cocina (la categoría con más variedad).

## Convención de Nombres

Se sigue una convención clara y consistente para los nombres de archivos de imagen:

### Reglas Generales
- **Minúsculas obligatorias**: Todos los nombres de archivo deben estar en minúsculas
- **Separador de palabras**: Se utilizan guiones (`-`) para separar palabras
- **Sin espacios**: Nunca se utilizan espacios en los nombres
- **Descriptivo**: El nombre debe describir claramente el contenido de la imagen
- **Información útil**: Incluye marca, color, variante o característica distintiva cuando sea relevante

### Ejemplos de Convención

**Para productos:**
- `bateria-hudson-negra.png` → Marca + Tipo + Color
- `set-24-cubiertos-carol.png` → Tipo + Cantidad + Material + Marca
- `tacho-blanco-cuadrado.png` → Tipo + Color + Forma
- `tenedor-y-cuchillo-con-carne.png` → Descripción completa con uso

**Para imágenes destacadas:**
- `setcompletobaño.jpg` → Descriptivo del contenido
- `vasocapuchino.jpg` → Tipo + Variante

## Categorías de Producto

Las imágenes están organizadas en las siguientes categorías de producto:

| Categoría | Carpeta | Descripción | Productos |
|-----------|---------|-------------|-----------|
| **Baño** | `/products/baño` | Productos para el baño | Sets de baño, tachos, accesorios de baño |
| **Cocina** | `/products/cocina` | Productos para la cocina | Baterías de cocina, cubiertos, cafeteras, especieros, etc. |

### Extensiones de Archivo Utilizadas

- `.png` - Formato principal para imágenes de productos (soporta transparencia)
- `.jpg`/`.jpeg` - Formato para imágenes destacadas de mayor tamaño
- `.ico` - Favicon clásico
- `.webmanifest` - Manifest para aplicación web progresiva

## Tabla de Imágenes

| Nombre del Archivo | Categoría | Descripción |
|-------------------|-----------|-------------|
| `set24cubiertos1.jpg` | Featured | Set de 24 cubiertos destacado para carrusel |
| `setcompletobaño.jpg` | Featured | Set completo de baño para promocionar |
| `setnegrohudsonsartenes.jpg` | Featured | Set de sartenes Hudson negro para banner |
| `vasocapuchino.jpg` | Featured | Vaso capuchino para sección destacada |
| `logo-allmart.jpeg` | Logo | Logo principal de la marca AllMart |
| `favicon.ico` | Favicon | Favicon clásico en formato ICO |
| `favicon-16x16.png` | Favicon | Favicon pequeño para pestañas del navegador |
| `favicon-32x32.png` | Favicon | Favicon mediano para barra de dirección |
| `apple-touch-icon.png` | Favicon | Ícono para dispositivos Apple (home screen) |
| `android-chrome-192x192.png` | Favicon | Ícono de Android en resolución media |
| `android-chrome-512x512.png` | Favicon | Ícono de Android en alta resolución |
| `site.webmanifest` | Favicon | Archivo manifest para PWA |
| `set-de-baño-blanco.png` | Baño | Set completo de accesorios de baño color blanco |
| `tacho-blanco-cuadrado.png` | Baño | Tacho de basura blanco con forma cuadrada |
| `tacho-blanco-redondo.png` | Baño | Tacho de basura blanco con forma redonda |
| `bateria-ganito-hudson-gris-oscuro.png` | Cocina | Batería de cocina Granito Hudson gris oscuro |
| `bateria-hudson-granito-claro.png` | Cocina | Batería de cocina Granito Hudson color claro |
| `bateria-hudson-negra.png` | Cocina | Batería de cocina Hudson color negro |
| `bateria-hudson-verde.png` | Cocina | Batería de cocina Hudson color verde |
| `bateria-paris-negra.png` | Cocina | Batería de cocina Paris color negro |
| `botella.png` | Cocina | Botella para líquidos y bebidas |
| `cafetera.png` | Cocina | Cafetera eléctrica o de filtro |
| `canastos.png` | Cocina | Canastos/cestas para almacenamiento en cocina |
| `especieros.png` | Cocina | Especieros para guardar condimentos |
| `lata-cafe.png` | Cocina | Lata para almacenar café |
| `pinza-gris-silicona.png` | Cocina | Pinza de cocina color gris hecha de silicona |
| `pinza-negra-silicona.png` | Cocina | Pinza de cocina color negro hecha de silicona |
| `sarten-olla-y-pimentero.png` | Cocina | Combo: sartén, olla y pimentero |
| `set-24-cubiertos-carol.png` | Cocina | Set de 24 cubiertos marca Carol |
| `set-asado-fondo-azul.png` | Cocina | Set de herramientas para asado con fondo azul |
| `set-asado.png` | Cocina | Set de herramientas para asado |
| `set-cubierto-acero-carol.png` | Cocina | Set de cubiertos acero inoxidable marca Carol |
| `set-cubierto-acero-negro.png` | Cocina | Set de cubiertos acero inoxidable color negro |
| `set-cubierto-jumbo.png` | Cocina | Set de cubiertos tamaño jumbo/grandes |
| `set-cubierto.png` | Cocina | Set de cubiertos estándar |
| `set-cubiertos-carol-grises.png` | Cocina | Set de cubiertos marca Carol color gris |
| `set-granito-hudson-gris-olla-sarten-otros.png` | Cocina | Set Granito Hudson gris con olla, sartén y accesorios |
| `set-sarten-blanco.png` | Cocina | Set de sartenes color blanco |
| `tapa-hudson.png` | Cocina | Tapa de olla/sartén marca Hudson |
| `tenedor-y-cuchillo-con-carne.png` | Cocina | Tenedor y cuchillo presentados con carne |
| `tenedor-y-cuchillo.png` | Cocina | Tenedor y cuchillo estándar |
| `vasos.png` | Cocina | Set de vasos para bebidas |

## Notas Importantes

1. **Consistencia**: Mantener la convención de nombres al agregar nuevas imágenes
2. **Organización por categoría**: Las nuevas categorías de producto deben tener su propia subcarpeta en `/products`
3. **Tamaño de archivos**: Optimizar imágenes antes de subirlas para mejorar rendimiento
4. **Formato recomendado**: 
   - PNG para productos (mejor calidad, soporta transparencia)
   - JPG para imágenes destacadas (mejor compresión)
