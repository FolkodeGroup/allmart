---
Sistema de puntajes y distribución de ganancias
---

## ¿Cómo funciona el sistema de puntajes?

Cada tarea (issue) del proyecto tiene un puntaje asignado según su complejidad o importancia. Al finalizar el proyecto, se suman los puntajes de todas las tareas completadas por cada colaborador.

### Puntaje total del proyecto
El puntaje total será la suma de los puntajes de todos los issues completados. Este valor no se conoce hasta que el proyecto esté terminado y todos los issues hayan sido resueltos.

### Reparto proporcional del dinero
Al finalizar el proyecto, el dinero total se reparte entre los colaboradores según la proporción de puntaje obtenido por cada persona respecto al puntaje total del proyecto.

#### Ejemplo:
- Dinero total a repartir: $10,000
- Puntaje total del proyecto: 850
- Colaborador A: 250 puntos
- Colaborador B: 600 puntos

Cálculo:
- Colaborador A: (250 / 850) * $10,000 = $2,941
- Colaborador B: (600 / 850) * $10,000 = $7,059

### Reglas adicionales
- Cada issue debe tener asignado un responsable.
- Los puntajes deben ser definidos antes de iniciar cada tarea.
- El sistema debe ser transparente y accesible para todos los colaboradores.

---
Este archivo debe actualizarse si se modifica el sistema de puntajes o las reglas de reparto.

---

## Tabla de puntajes por tipo de tarea

### Issues (tareas de desarrollo)
| Complejidad    | Puntaje sugerido |
|----------------|-----------------|
| Muy baja       | 10              |
| Baja           | 20              |
| Media          | 30–40           |
| Alta           | 60–80           |
| Muy alta       | 100–200         |

### Actividades de gestión (automáticas — acreditadas a dgimenezdeveloper)
Estas actividades son registradas automáticamente por GitHub Actions en `MANAGEMENT_LOG.md` cada vez que ocurren, y se suman a los puntajes del responsable de gestión del repositorio.

| Actividad                                         | Puntaje |
|---------------------------------------------------|---------|
| Revisión de PR — Aprobación                       | 15      |
| Revisión de PR — Solicitud de cambios             | 10      |
| Revisión de PR — Comentario de revisión           | 5       |
| Merge de PR                                       | 15      |
| Apertura de PR                                    | 5       |
| Creación de milestone                             | 5       |
| Cierre de milestone                               | 15      |
| Creación de issue                                 | 3       |
| Etiquetado de issue                               | 2       |
| Asignación de issue                               | 3       |

> **Nota:** El usuario `folkodegroup` también se mapea a `dgimenezdeveloper` a efectos de puntaje, ya que representa la misma persona actuando como organización.

### Reglas de transparencia y auditoría
- Todas las actividades de gestión quedan registradas en `MANAGEMENT_LOG.md` con fecha, tipo de acción y puntaje.
- **Actualización Automática:** Cada domingo a las 00:00 UTC, un workflow de GitHub Actions (`actualizar_puntajes_semanal.yml`) sincroniza todo el historial y actualiza `SCORES.md` automáticamente.
- El script `sumar_puntajes.cjs` consolida tanto los puntajes de issues como los de gestión en `SCORES.md`.
- Cualquier colaborador puede auditar el log en `MANAGEMENT_LOG.md` o ejecutar el script localmente con su propio `GITHUB_TOKEN`.
