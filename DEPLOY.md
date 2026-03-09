# Despliegue en VPS DonWeb — Allmart

Guía completa para desplegar Allmart en el VPS cloud de DonWeb usando Docker, DockerHub y GitHub Actions.

---

## Datos del VPS

| Dato | Valor |
|------|-------|
| Host | `168.197.49.120` |
| Puerto SSH | `5371` |
| Usuario | `root` |
| Directorio de despliegue | `/opt/allmart` |

## Arquitectura del despliegue

```
GitHub (push a main)
     │
     ├─ GitGuardian Scan          ← Escaneo de secretos
     ├─ Build & Test              ← Compilación y lint
     ├─ Docker Build & Push       ← Imágenes en DockerHub
     │      dgimenezdeveloper/allmart-backend:latest
     │      dgimenezdeveloper/allmart-frontend:latest
     │
     └─ Deploy SSH → VPS (168.197.49.120:5371)
            └─ /opt/allmart/
                   ├─ docker-compose.prod.yml
                   ├─ .env  (generado por CI/CD, NUNCA versionado)
                   └─ docker/ (init scripts de BD)
```

## Puertos en producción (VPS)

| Servicio | Puerto VPS | Puerto contenedor | URL acceso |
|----------|-----------|------------------|------------|
| Frontend | `8082` | `80` | `http://168.197.49.120:8082` |
| Backend  | `3002` | `3001` | `http://168.197.49.120:3002/api` |
| Base de datos | `5433` | `5432` | Solo acceso interno |

> Los puertos son distintos a los típicos (8080, 3001, 5432) para no conflictuar con el proyecto existente en el VPS.

---

## Configuración inicial (una sola vez)

### 1. Generar clave SSH para el VPS

En tu máquina local, genera un par de claves exclusivo para el deploy:

```bash
ssh-keygen -t ed25519 -C "allmart-cicd-deploy" -f ~/.ssh/allmart_deploy_key
```

Agrega la clave pública al VPS:

```bash
ssh-copy-id -i ~/.ssh/allmart_deploy_key.pub -p 5371 root@168.197.49.120
```

Verifica que funciona:

```bash
ssh -i ~/.ssh/allmart_deploy_key -p 5371 root@168.197.49.120 "echo OK"
```

### 2. Configurar secretos en GitHub

Ve a **Settings → Secrets and variables → Actions** del repositorio y agrega:

| Secret | Descripción | Ejemplo |
|--------|-------------|---------|
| `DOCKERHUB_TOKEN` | Token de acceso de DockerHub (no la contraseña) | `dckr_pat_xxx...` |
| `VPS_SSH_KEY` | Contenido completo de `~/.ssh/allmart_deploy_key` (clave **privada**) | `-----BEGIN OPENSSH...` |
| `VPS_DB_USER` | Usuario de la base de datos | `allmart_user` |
| `VPS_DB_PASSWORD` | Contraseña de la base de datos (fuerte) | `S3cr3t@Pwd!` |
| `VPS_DB_NAME` | Nombre de la base de datos | `allmart_db` |
| `VPS_JWT_SECRET` | Secret JWT para firmar tokens (mínimo 64 chars) | `xxxxxxxx...` |
| `VPS_CORS_ORIGIN` | URL pública del frontend | `http://168.197.49.120:8082` |
| `GITGUARDIAN_API_KEY` | API Key de GitGuardian | `xxxxxxxx...` |

#### Cómo obtener el token de DockerHub

1. Ir a [hub.docker.com](https://hub.docker.com) → Account Settings → Security
2. Crear un **Access Token** con permisos de lectura y escritura
3. Copiar el token generado (solo se muestra una vez)

#### Cómo obtener la API Key de GitGuardian

1. Ir a [dashboard.gitguardian.com](https://dashboard.gitguardian.com)
2. API → Personal API Tokens → Create token
3. Copiar el token generado

### 3. Crear directorio de despliegue en el VPS

```bash
ssh -p 5371 root@168.197.49.120 "mkdir -p /opt/allmart"
```

### 4. Configurar GitHub Environment "production"

1. Ve a **Settings → Environments**
2. Crea un environment llamado `production`
3. (Opcional) Agrega reviewers requeridos para el deploy

---

## Flujo de despliegue automático

Cada vez que se hace **push a `main`**:

```
1. GitGuardian escanea el código buscando secretos expuestos
2. Se compila y testea frontend y backend
3. Se construyen las imágenes Docker y se pushean a DockerHub:
   - dgimenezdeveloper/allmart-backend:latest
   - dgimenezdeveloper/allmart-backend:<7-char-sha>
   - dgimenezdeveloper/allmart-frontend:latest
   - dgimenezdeveloper/allmart-frontend:<7-char-sha>
4. Via SSH al VPS:
   - Se copia docker-compose.prod.yml y archivos de init-db
   - Se genera el .env de producción desde los secrets de GitHub
   - Se hace pull de las nuevas imágenes
   - Se reinician los contenedores: docker compose down + up -d
   - Verificación de estado
```

---

## Despliegue manual desde el VPS

Si necesitas desplegar manualmente sin usar el pipeline:

```bash
# Conectarse al VPS
ssh -p 5371 root@168.197.49.120

# Ir al directorio del proyecto
cd /opt/allmart

# Asegurarse de que existe el .env (copiar del ejemplo si no existe)
# cp .env.vps.example .env
# nano .env  # editar con los valores reales

# Pull de las últimas imágenes
docker compose -f docker-compose.prod.yml pull

# Reiniciar contenedores
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Ver logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## Comandos útiles en producción

```bash
# Ver estado de los contenedores
docker compose -f /opt/allmart/docker-compose.prod.yml ps

# Ver logs del backend
docker compose -f /opt/allmart/docker-compose.prod.yml logs -f backend

# Ver logs del frontend
docker compose -f /opt/allmart/docker-compose.prod.yml logs -f frontend

# Reiniciar un servicio específico (ej. backend)
docker compose -f /opt/allmart/docker-compose.prod.yml restart backend

# Ver uso de recursos
docker stats

# Actualizar solo el backend manualmente
docker pull dgimenezdeveloper/allmart-backend:latest
docker compose -f /opt/allmart/docker-compose.prod.yml up -d --no-deps backend
```

---

## Seguridad

### GitGuardian
- El pipeline escanea **todos los commits** usando [GitGuardian](https://gitguardian.com)
- Si se detecta algún secreto expuesto, el pipeline falla y **no se despliega**
- Los resultados se pueden ver en el [dashboard de GitGuardian](https://dashboard.gitguardian.com)

### Prácticas implementadas
- El archivo `.env` **nunca** se versiona (está en `.gitignore`)
- Las credenciales se pasan al VPS vía GitHub Secrets (cifradas)
- El `.env` se escribe en el VPS en tiempo de deploy y no se guarda en el repositorio
- Los Dockerfiles usan usuarios no-root en producción (backend)
- Las imágenes usan builds multi-stage para reducir superficie de ataque

---

## Troubleshooting

### El pipeline falla en el step de GitGuardian
- Verifica que el secret `GITGUARDIAN_API_KEY` esté configurado en GitHub
- Revisa el [dashboard de GitGuardian](https://dashboard.gitguardian.com) para ver el incidente detectado

### Error de SSH al conectar al VPS
- Verifica que el secret `VPS_SSH_KEY` contenga la clave privada completa (incluyendo `-----BEGIN...`)
- Confirma que la clave pública está en `/root/.ssh/authorized_keys` en el VPS
- El puerto SSH del VPS es `5371` (no el estándar 22)

### Los contenedores no levantan
```bash
# En el VPS, ver logs detallados
cd /opt/allmart
docker compose -f docker-compose.prod.yml logs
```

### Conflicto de puertos con el otro proyecto del VPS
- El proyecto Allmart usa puertos `8082`, `3002` y `5433`
- Si hay conflicto, modificar los valores `FRONTEND_PORT`, `BACKEND_PORT` y `DB_PORT_HOST` en el `.env` del VPS
