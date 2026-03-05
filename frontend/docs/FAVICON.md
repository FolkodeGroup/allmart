# FAVICON.md

Este documento describe el proceso utilizado para generar los favicons del proyecto y cómo actualizarlo en el futuro.

## Herramienta utilizada

Se empleó el generador online **[favicon.io](https://favicon.io/)**, que permite subir un logo y obtener un paquete con los distintos tamaños estándar en varios formatos (ico, png, apple-touch, etc.).

> Cualquier otro servicio similar (realfavicongenerator.net, genfavicon.com, etc.) puede usarse si se prefiere. La idea es obtener los mismos archivos con los mismos nombres.

## Pasos para generar el favicon

1. **Obtener el logo**: usar el logo oficial del proyecto (por ejemplo `src/assets/images/logos/logo.png`).
2. Acceder a [https://favicon.io/favicon-generator/](https://favicon.io/favicon-generator/).
3. Seleccionar "**Image to Favicon**" y subir el archivo del logo.
4. Ajustar opciones si es necesario (margen, fondo transparente, etc.).
5. Hacer clic en **Generate** y descargar el paquete ZIP resultante.
6. Extraer el contenido y copiar los siguientes archivos a `frontend/public/`:
   - `favicon.ico` (archivo `.ico` que contiene varias resoluciones)
   - `favicon-16x16.png`
   - `favicon-32x32.png`
   - `favicon-48x48.png`
   - `favicon-64x64.png`
   - `apple-touch-icon.png` (180x180)
   - (opcional: otros tamaños como `android-chrome-192x192.png` y `android-chrome-512x512.png` si se desea)
7. Verificar que el manifiesto (`frontend/public/manifest.json`) y `index.html` apuntan a los nombres correctos. Actualizar si cambian.

## Actualizar el favicon en el futuro

1. Repetir el procedimiento anterior con la versión nueva del logo.
2. Reemplazar los archivos existentes en `frontend/public/` con los nuevos.
3. Asegurarse de que la cache del navegador no esté sirviendo una versión antigua (limpiar cache o cambiar el nombre si fuese necesario).
4. Commit y push de los archivos actualizados junto con la documentación si corresponde.

> **Tip:** el manifiesto y los enlaces en `index.html` ya están configurados para los nombres estándar. Sólo hay que mantenerlos si se siguen usando esos nombres.

## Notas adicionales

- `favicon.ico` es importante para navegadores clásicos y algunas pestañas de Windows.
- `apple-touch-icon.png` se usa en iOS cuando el usuario agrega el sitio a la pantalla de inicio.
- Si se generan iconos adicionales (Android, Windows tiles), actualizar el manifiesto con sus rutas.

---

Fin del documento.
