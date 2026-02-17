# Script para sumar puntajes de issues cerrados

Este script suma automáticamente los puntajes de todos los issues cerrados y genera una tabla con el puntaje acumulado por cada dev en el archivo SCORES.md.

## Uso

1. Instala las dependencias:
   ```bash
   npm install node-fetch@2
   ```
2. Exporta tu token de GitHub (con permisos de repo):
   ```bash
   export GITHUB_TOKEN=tu_token_aqui
   ```
3. Ejecuta el script:
   ```bash
   node scripts/sumar_puntajes.js
   ```

## Notas
- El script busca la línea `PUNTAJE: <número>` en el cuerpo de cada issue cerrado.
- Suma el puntaje a cada usuario asignado al issue.
- Actualiza o crea el archivo SCORES.md en la raíz del proyecto.
- Puedes programar este script para que corra periódicamente o al final del proyecto.
