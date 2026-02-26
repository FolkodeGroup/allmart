# Sistema de puntajes — Scripts

## Flujo completo (primera vez o actualización total)

```
frontend/           ← ejecutar desde acá
├── scripts/
│   ├── generar_management_log.cjs   ← PASO 1: genera historial retroactivo
│   └── sumar_puntajes.cjs           ← PASO 2: consolida todo en SCORES.md
```

### Paso 0 — Configurar token

Creá el archivo `frontend/.env` con tu token de GitHub:
```
GITHUB_TOKEN=ghp_tu_token_aqui
```

### Paso 1 — Generar historial retroactivo (solo la primera vez o cuando quieras reconstruirlo)

Este script recorre **todo el historial del repo** y genera `MANAGEMENT_LOG.md` con:
- PRs abiertos y mergeados por dgimenezdeveloper/folkodegroup
- Reviews de PRs (aprobaciones, cambios solicitados, comentarios)
- Milestones creados y cerrados
- Issues creados, etiquetados y asignados

```bash
cd frontend
node scripts/generar_management_log.cjs
```

### Paso 2 — Consolidar todo en SCORES.md

Este script suma:
1. Puntajes de **issues cerrados** (busca `PUNTAJE: N` en el cuerpo)
2. Puntajes de **actividades de gestión** desde `MANAGEMENT_LOG.md`

```bash
node scripts/sumar_puntajes.cjs
```

El resultado se escribe en `frontend/SCORES.md`.

---

## Flujo semanal (mantenimiento)

A partir de la primera ejecución, los puntajes de gestión se acumulan automáticamente via GitHub Actions (`puntajes_gestion.yml`). Solo necesitás correr el **Paso 2** cada semana (o cuando recibas el issue de recordatorio dominical).

---

## Notas
- `folkodegroup` se mapea automáticamente a `dgimenezdeveloper`.
- `MANAGEMENT_LOG.md` está en la **raíz del repo** (no en frontend/).
- No editar `MANAGEMENT_LOG.md` manualmente; puede ser sobreescrito.
- El recordatorio dominical crea un issue automático si SCORES.md no fue actualizado en 7 días.
