# 🐳 Allmart — Guía de Docker

Guía completa para levantar el proyecto Allmart (backend + frontend + base de datos) usando Docker y Docker Compose.

> **¿Por qué Docker?** Docker permite ejecutar todo el proyecto sin instalar Node.js, PostgreSQL ni ninguna otra dependencia en tu computadora. Todo corre dentro de contenedores aislados.

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#1-requisitos-previos)
   - [Linux](#linux)
   - [Windows](#windows-paso-a-paso-detallado)
   - [Mac](#mac)
2. [Instalación Rápida (TL;DR)](#2-instalación-rápida-tldr)
3. [Configuración del Entorno](#3-configuración-del-entorno)
4. [Levantar el Proyecto](#4-levantar-el-proyecto)
5. [Acceder a la Aplicación](#5-acceder-a-la-aplicación)
6. [Comandos Útiles](#6-comandos-útiles)
7. [Desarrollo con Docker](#7-desarrollo-con-docker)
8. [Solución de Problemas](#8-solución-de-problemas)
   - [Problemas en Windows](#problemas-comunes-en-windows)
   - [Problemas en Linux](#problemas-comunes-en-linux)
   - [Problemas Generales](#problemas-generales)
9. [Arquitectura Docker](#9-arquitectura-docker)
10. [Producción](#10-producción)

---

## 1. Requisitos Previos

### Linux

1. **Instalar Docker Engine:**
   ```bash
   # Ubuntu / Debian
   sudo apt update
   sudo apt install -y docker.io docker-compose-plugin

   # Verificar instalación
   docker --version
   docker compose version
   ```

2. **Ejecutar Docker sin `sudo` (opcional pero recomendado):**
   ```bash
   sudo usermod -aG docker $USER
   # Cerrar sesión y volver a iniciar para que aplique
   ```

3. **Verificar que Docker funciona:**
   ```bash
   docker run hello-world
   ```

---

### Windows (Paso a Paso Detallado)

> ⚠️ **Esta sección está escrita paso a paso para usuarios de Windows.** Si nunca usaste Docker, seguí cada paso sin saltear ninguno.

#### Paso 1: Verificar que tu Windows soporta Docker

Docker Desktop requiere **Windows 10 versión 2004** o superior, o **Windows 11**.

Para verificar tu versión:
1. Presioná las teclas `Windows + R` (se abre una ventanita llamada "Ejecutar")
2. Escribí `winver` y presioná Enter
3. Se abre una ventana que dice tu versión de Windows
4. Debe decir **versión 2004** o superior

#### Paso 2: Habilitar WSL 2 (Windows Subsystem for Linux)

Docker en Windows necesita WSL 2. Hay que habilitarlo:

1. Abrí **PowerShell como Administrador:**
   - Hacé clic derecho en el botón de Inicio (ícono de Windows abajo a la izquierda)
   - Seleccioná **"Terminal (Administrador)"** o **"Windows PowerShell (Administrador)"**
   - Si aparece un cartel preguntando si querés permitir cambios, hacé clic en **"Sí"**

2. Ejecutá este comando (copialo y pegalo):
   ```powershell
   wsl --install
   ```

3. **Reiniciá la computadora** cuando te lo pida.

4. Después de reiniciar, abrí PowerShell de nuevo (como Administrador) y verificá:
   ```powershell
   wsl --version
   ```
   Deberías ver algo como `WSL versión: 2.x.x`

5. Si por alguna razón WSL no se instaló con la versión 2, ejecutá:
   ```powershell
   wsl --set-default-version 2
   ```

#### Paso 3: Instalar Docker Desktop

1. Abrí tu navegador y andá a: **https://www.docker.com/products/docker-desktop/**

2. Hacé clic en el botón **"Download for Windows"**

3. Se descarga un archivo llamado `Docker Desktop Installer.exe`

4. Hacé **doble clic** en el archivo descargado para instalarlo

5. Durante la instalación:
   - ✅ Dejá marcada la opción **"Use WSL 2 instead of Hyper-V"**
   - ✅ Dejá marcada la opción **"Add shortcut to desktop"**
   - Hacé clic en **"Ok"** / **"Install"**

6. Cuando termine, hacé clic en **"Close and restart"** (va a reiniciar la computadora)

#### Paso 4: Configurar Docker Desktop

1. Después de reiniciar, Docker Desktop se abre automáticamente (un ícono de ballena aparece en la barra de tareas abajo a la derecha)

2. Si te pide aceptar los términos de servicio, hacé clic en **"Accept"**

3. **No necesitás crear cuenta** — si te pide login, podés hacer clic en **"Skip"** o **"Continue without signing in"**

4. Esperá a que diga **"Docker Desktop is running"** (puede tardar 1-2 minutos)

5. Para verificar que funciona, abrí **PowerShell** (no necesita ser administrador) y escribí:
   ```powershell
   docker --version
   ```
   Deberías ver algo como: `Docker version 27.x.x`

6. Probá también:
   ```powershell
   docker compose version
   ```
   Deberías ver algo como: `Docker Compose version v2.x.x`

#### Paso 5: Verificar que todo funciona

Ejecutá este comando en PowerShell:
```powershell
docker run hello-world
```

Si ves un mensaje que dice **"Hello from Docker!"**, ¡todo está listo! 🎉

---

### Mac

1. Descargá Docker Desktop desde: https://www.docker.com/products/docker-desktop/
2. Arrastrá Docker al folder de Aplicaciones
3. Abrí Docker Desktop y esperá a que inicie
4. Verificá en Terminal:
   ```bash
   docker --version
   docker compose version
   ```

---

## 2. Instalación Rápida (TL;DR)

Si ya tenés Docker instalado, estos son los únicos comandos que necesitás:

**Linux / Mac:**
```bash
# 1. Clonar el repositorio (si no lo tenés)
git clone <url-del-repo> allmart
cd allmart

# 2. Copiar el archivo de variables de entorno
cp .env.docker.example .env

# 3. Levantar todo el stack
docker compose up --build

# 4. Abrir en el navegador: http://localhost:8080
```

**En Windows (PowerShell):**
```powershell
# 1. Clonar el repositorio (si no lo tenés)
git clone <url-del-repo> allmart
cd allmart

# 2. Copiar el archivo de variables de entorno
copy .env.docker.example .env

# 3. Levantar todo el stack
docker compose up --build

# 4. Abrir en el navegador: http://localhost:8080
```

### Usuarios por defecto

Al levantar el proyecto por primera vez, se crean automáticamente estos usuarios para acceder al **Panel de Administración** (`http://localhost:8080/admin`):

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Admin** | `admin@admin.com` | `admin` |
| **Editor** | `editor@allmart.com` | `admin` |

> ⚠️ **Importante:** Estas credenciales son solo para desarrollo. Cambialas inmediatamente en producción.

---

## 3. Configuración del Entorno

### 3.1 Crear el archivo `.env`

El archivo `.env` contiene las variables de configuración del proyecto. **Nunca** subas este archivo al repositorio.

**Linux / Mac / WSL:**
```bash
cp .env.docker.example .env
```

**Windows CMD:**
```cmd
copy .env.docker.example .env
```

**Windows PowerShell:**
```powershell
Copy-Item .env.docker.example .env
```

### 3.2 Editar el archivo `.env` (opcional)

Abrí el archivo `.env` con cualquier editor de texto y ajustá los valores si lo necesitás:

```dotenv
# Base de datos
DB_USER=postgres
DB_PASSWORD=changeme          # ⚠️ Cambiá esto en producción
DB_NAME=allmart_db
DB_PORT_HOST=5432             # Si ya tenés PostgreSQL instalado, cambiá a 5433

# Backend
NODE_ENV=development
BACKEND_PORT=3001
JWT_SECRET=changeme
CORS_ORIGIN=http://localhost:8080

# Frontend
FRONTEND_PORT=8080            # Puerto donde accedés a la app en el navegador
```

> **💡 Tip:** Si ya tenés PostgreSQL instalado en tu computadora y está usando el puerto 5432, cambiá `DB_PORT_HOST` a `5433` o cualquier otro puerto libre.

---

## 4. Levantar el Proyecto

### Primera vez (build + arranque)

Este comando descarga las imágenes necesarias, construye los contenedores y levanta todo:

```bash
docker compose up --build
```

> ⏳ **La primera vez tarda varios minutos** porque descarga imágenes de Node.js, PostgreSQL y nginx, e instala todas las dependencias. Las siguientes veces es mucho más rápido.

### En segundo plano (modo detached)

Si querés que corra en segundo plano (sin ocupar la terminal):

```bash
docker compose up --build -d
```

### Veces siguientes (sin rebuild)

Si no cambiaste ningún archivo de Docker, podés levantar sin rebuild:

```bash
docker compose up -d
```

### Ver que los contenedores están corriendo

```bash
docker compose ps
```

Deberías ver algo como:
```
NAME              STATUS          PORTS
allmart-db        Up (healthy)    0.0.0.0:5432->5432/tcp
allmart-backend   Up (healthy)    0.0.0.0:3001->3001/tcp
allmart-frontend  Up (healthy)    0.0.0.0:8080->80/tcp
```

---

## 5. Acceder a la Aplicación

Una vez que los tres contenedores estén corriendo (status "Up"):

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:8080 | Aplicación web (React) |
| **Backend API** | http://localhost:3001 | API REST (Express) |
| **Backend Health** | http://localhost:3001/ | Health check del backend |
| **Base de datos** | `localhost:5432` | PostgreSQL (conectar con pgAdmin, DBeaver, etc.) |
| **Panel Admin** | http://localhost:8080/admin | Panel de administración (login requerido) |

### Credenciales de Acceso

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Admin** | `admin@admin.com` | `admin` |
| **Editor** | `editor@allmart.com` | `admin` |

> **Nota para Windows:** Si `localhost` no funciona, probá con `127.0.0.1` en su lugar.

---

## 6. Comandos Útiles

### Gestión de Contenedores

```bash
# Levantar todo (modo interactivo, ves los logs)
docker compose up

# Levantar todo en segundo plano
docker compose up -d

# Levantar con rebuild (después de cambiar Dockerfiles)
docker compose up --build -d

# Detener todos los contenedores
docker compose down

# Detener y ELIMINAR volúmenes (borra la base de datos)
docker compose down -v

# Reiniciar un servicio específico
docker compose restart backend
docker compose restart frontend
docker compose restart db
```

### Logs

```bash
# Ver logs de todos los servicios
docker compose logs

# Ver logs en tiempo real (como un tail -f)
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs backend
docker compose logs frontend
docker compose logs db

# Ver las últimas 50 líneas de un servicio
docker compose logs --tail=50 backend
```

### Base de Datos

```bash
# Conectar a PostgreSQL dentro del contenedor
docker compose exec db psql -U postgres -d allmart_db

# Ejecutar un comando SQL directamente
docker compose exec db psql -U postgres -d allmart_db -c "SELECT * FROM users;"

# Hacer backup de la base de datos
docker compose exec db pg_dump -U postgres allmart_db > backup.sql

# Restaurar un backup
docker compose exec -T db psql -U postgres allmart_db < backup.sql
```

### Ejecutar Comandos en Contenedores

```bash
# Abrir una terminal dentro del backend
docker compose exec backend sh

# Abrir una terminal dentro del frontend (nginx)
docker compose exec frontend sh

# Ejecutar npm dentro del backend
docker compose exec backend npm run migrate
```

### Limpieza

```bash
# Eliminar contenedores, redes y volúmenes del proyecto
docker compose down -v --remove-orphans

# Eliminar imágenes construidas del proyecto
docker compose down --rmi local

# Limpieza total de Docker (⚠️ afecta TODOS los proyectos Docker)
docker system prune -a --volumes
```

---

## 7. Desarrollo con Docker

### Flujo de Trabajo Recomendado

1. **Para desarrollo diario**, se recomienda correr el proyecto sin Docker (usando `npm run dev` en backend y frontend) ya que el hot-reload es instantáneo.

2. **Usar Docker para:**
   - Probar que todo funciona en un entorno limpio
   - Levantar solo la base de datos (y el backend/frontend sin Docker)
   - Simular el entorno de producción
   - Compartir el proyecto con alguien que no tiene Node.js/PostgreSQL instalado

### Modo Híbrido: Solo la Base de Datos en Docker

Si querés usar Docker solo para PostgreSQL y correr el backend/frontend localmente:

```bash
# Levantar solo la base de datos
docker compose up db -d

# Ahora en otra terminal, correr el backend localmente
cd backend
cp ../.env.docker.example .env
# Editar .env: cambiar DB_HOST=db por DB_HOST=localhost
npm install
npm run dev

# En otra terminal, correr el frontend
cd frontend
npm install
npm run dev
```

### Rebuild Después de Cambios

Si modificaste algún archivo de Docker o instalaste nuevas dependencias:

```bash
# Rebuild solo el backend
docker compose up --build backend -d

# Rebuild solo el frontend
docker compose up --build frontend -d

# Rebuild todo
docker compose up --build -d
```

---

## 8. Solución de Problemas

### ⚠️ Advertencias Importantes para Usuarios de Windows

Antes de empezar, asegurate de tener en cuenta estos puntos (son los que más problemas causan):

1. **Finales de línea (CRLF vs LF):** El proyecto incluye un archivo `.gitattributes` que fuerza los finales de línea correctos automáticamente. **Si clonaste el repo antes de que existiera este archivo**, es posible que los scripts `.sh` tengan finales de línea incorrectos. En ese caso, re-cloná el repositorio o ejecutá en Git Bash:
   ```bash
   git rm --cached -r . && git reset --hard
   ```

2. **Docker Desktop debe estar corriendo:** Antes de ejecutar cualquier comando `docker`, asegurate de que Docker Desktop esté abierto y diga "Docker Desktop is running" (ícono de ballena verde en la barra de tareas).

3. **Puertos en uso:** Si tenés PostgreSQL instalado localmente, seguramente está usando el puerto 5432. Cambiá `DB_PORT_HOST=5433` en el archivo `.env` antes de levantar Docker.

4. **Primera vez tarda:** La primera vez que ejecutás `docker compose up --build` puede tardar 5-10 minutos porque se descargan las imágenes base. **No canceles el proceso** aunque parezca que se trabó.

5. **Usá PowerShell, no CMD:** Algunos comandos pueden no funcionar en CMD. Siempre usá PowerShell o, mejor aún, Windows Terminal.

---

### Problemas Comunes en Windows

#### ❌ "Docker Desktop - WSL 2 backend requires WSL 2"

**Causa:** WSL 2 no está instalado o habilitado.

**Solución:**
1. Abrí **PowerShell como Administrador**
2. Ejecutá:
   ```powershell
   wsl --install
   ```
3. Reiniciá la computadora
4. Si sigue sin funcionar, habilitá la Virtualización en la BIOS:
   - Reiniciá la PC y durante el arranque presioná `F2`, `F10`, `Del` o `Esc` (depende de tu marca de PC)
   - Buscá una opción llamada **"Intel Virtualization Technology"** o **"SVM Mode"** (AMD)
   - Ponela en **Enabled**
   - Guardá los cambios y reiniciá

#### ❌ "Cannot connect to the Docker daemon"

**Causa:** Docker Desktop no está corriendo.

**Solución:**
1. Buscá "Docker Desktop" en el menú de inicio de Windows
2. Abrilo y esperá a que diga "Docker Desktop is running"
3. Probá de nuevo el comando

#### ❌ "port is already allocated" o "bind: address already in use"

**Causa:** Otro programa ya está usando ese puerto.

**Solución:**
1. Identificá qué programa está usando el puerto:
   ```powershell
   # Ver qué usa el puerto 5432
   netstat -aon | findstr :5432
   ```
2. Terminá ese programa, o cambiá el puerto en el archivo `.env`:
   ```dotenv
   DB_PORT_HOST=5433        # Cambiá a otro puerto
   BACKEND_PORT=3002
   FRONTEND_PORT=8081
   ```
3. Volvé a levantar:
   ```bash
   docker compose down
   docker compose up -d
   ```

#### ❌ "Error response from daemon: Ports are not available"

**Causa:** El servicio de Hyper-V reservó rangos de puertos.

**Solución:**
1. Abrí **PowerShell como Administrador**
2. Ejecutá:
   ```powershell
   net stop winnat
   net start winnat
   ```
3. Volvé a levantar Docker

#### ❌ Los archivos se guardan con finales de línea incorrectos (CRLF vs LF)

**Causa:** Windows usa `CRLF` (\r\n) como fin de línea, pero los scripts de Docker/Linux necesitan `LF` (\n).

**Síntoma:** El backend muestra un error como `exec format error` o `not found` al intentar arrancar.

**Solución (elegí una):**

**Opción A — Re-clonar (la más segura):**
1. Configurá Git para no convertir finales de línea:
   ```powershell
   git config --global core.autocrlf input
   ```
2. Borrá la carpeta del proyecto y cloná de nuevo:
   ```powershell
   cd ..
   Remove-Item -Recurse -Force allmart
   git clone <url-del-repo> allmart
   cd allmart
   ```

**Opción B — Corregir los archivos existentes:**
1. Abrí Git Bash (viene incluido con Git for Windows)
2. Ejecutá:
   ```bash
   cd /ruta/a/allmart
   git rm --cached -r . && git reset --hard
   ```

**Opción C — Corregir manualmente en VS Code:**
1. Abrí el archivo `backend/docker-entrypoint.sh` en VS Code
2. Mirá abajo a la derecha, donde dice **"CRLF"**
3. Hacé clic ahí y seleccioná **"LF"**
4. Guardá el archivo (Ctrl+S)

> **Nota:** El proyecto incluye un archivo `.gitattributes` que fuerza `LF` automáticamente para archivos `.sh`, `.sql` y de Docker. Si clonás el repo de nuevo, no deberías tener este problema.

#### ❌ Docker Desktop es muy lento o usa mucha memoria

**Solución:**
1. Abrí Docker Desktop → ⚙️ Settings → Resources
2. Ajustá:
   - **Memory:** Mínimo 4 GB (recomendado 6-8 GB)
   - **CPUs:** Mínimo 2
   - **Disk image size:** Mínimo 20 GB
3. Hacé clic en "Apply & Restart"

Si usás WSL 2, podés crear un archivo `.wslconfig` en tu carpeta de usuario para limitar el uso de recursos:
1. Abrí el Explorador de archivos
2. En la barra de direcciones escribí: `%USERPROFILE%`
3. Creá un archivo nuevo llamado `.wslconfig` (sin extensión)
4. Pegá este contenido:
   ```ini
   [wsl2]
   memory=4GB
   processors=2
   ```
5. Reiniciá WSL: abrí PowerShell y ejecutá `wsl --shutdown`

---

### Problemas Comunes en Linux

#### ❌ "Got permission denied while trying to connect to the Docker daemon socket"

**Causa:** Tu usuario no tiene permisos para ejecutar Docker.

**Solución:**
```bash
sudo usermod -aG docker $USER
# Cerrar sesión y volver a iniciar
# O ejecutar en la misma terminal:
newgrp docker
```

#### ❌ "docker compose" no funciona (pero "docker-compose" sí)

**Causa:** Tenés instalada la versión antigua (V1) de Docker Compose.

**Solución:**
```bash
# Instalar el plugin de Compose V2
sudo apt install docker-compose-plugin

# Verificar
docker compose version
```

---

### Problemas Generales

#### ❌ El backend no se conecta a la base de datos

**Causa:** La base de datos aún no está lista cuando el backend intenta conectarse.

**Solución:** Esto no debería pasar porque el `docker-compose.yml` incluye `depends_on` con health checks. Pero si ocurre:
```bash
# Detener todo
docker compose down

# Levantar solo la DB primero
docker compose up db -d

# Esperar 10 segundos y verificar
docker compose ps

# Luego levantar el resto
docker compose up -d
```

#### ❌ Los cambios en el código no se reflejan

**Causa:** Docker cacheó la imagen anterior.

**Solución:**
```bash
# Rebuild forzando sin cache
docker compose build --no-cache

# Levantar de nuevo
docker compose up -d
```

#### ❌ "no space left on device"

**Causa:** Docker está usando todo el espacio de disco.

**Solución:**
```bash
# Ver cuánto espacio usa Docker
docker system df

# Limpiar imágenes, contenedores y volúmenes no utilizados
docker system prune -a --volumes
```

#### ❌ Quiero empezar de cero (borrar TODO)

```bash
# Detener contenedores y borrar volúmenes (incluida la base de datos)
docker compose down -v --remove-orphans

# Borrar imágenes del proyecto
docker compose down --rmi local

# Levantar desde cero
docker compose up --build -d
```

---

## 9. Arquitectura Docker

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Compose (allmart)                      │
│                                                                 │
│  ┌──────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │              │   │                  │   │                │  │
│  │   frontend   │──▶│     backend      │──▶│       db       │  │
│  │  (nginx:80)  │   │  (express:3001)  │   │  (postgres:    │  │
│  │              │   │                  │   │    5432)       │  │
│  └──────┬───────┘   └──────────────────┘   └───────┬────────┘  │
│         │                                          │           │
│         │              allmart-network              │           │
│         │                                          │           │
└─────────│──────────────────────────────────────────│───────────┘
          │                                          │
     :8080 (host)                              pgdata (volume)
          │
     http://localhost:8080
```

### Servicios

| Servicio | Imagen | Puerto Interno | Puerto Host | Descripción |
|----------|--------|---------------|-------------|-------------|
| `db` | `postgres:16-alpine` | 5432 | 5432 | Base de datos PostgreSQL |
| `backend` | Build desde `./backend/Dockerfile` | 3001 | 3001 | API REST (Node.js + Express) |
| `frontend` | Build desde `./frontend/Dockerfile` | 80 | 8080 | App React servida con nginx |

### Flujo de Red

1. El usuario accede a `http://localhost:8080` (frontend)
2. El frontend (nginx) sirve la app React
3. Las llamadas a `/api/*` son proxeadas por nginx al backend (`backend:3001`)
4. El backend se conecta a la base de datos usando `db:5432` (nombre del servicio Docker)

### Volúmenes

| Volumen | Uso |
|---------|-----|
| `pgdata` | Datos persistentes de PostgreSQL. Se mantienen aunque detengas los contenedores. Solo se borran con `docker compose down -v`. |

---

## 10. Producción

Para un entorno de producción, se recomienda:

1. **Cambiar las variables de entorno:**
   ```dotenv
   NODE_ENV=production
   DB_PASSWORD=una_contraseña_muy_segura_y_larga
   JWT_SECRET=otro_secreto_muy_largo_y_complejo
   ```

2. **No exponer el puerto de PostgreSQL:**
   ```yaml
   # En docker-compose.yml, comentar o eliminar los ports de db:
   # ports:
   #   - "${DB_PORT_HOST:-5432}:5432"
   ```

3. **Usar HTTPS** con un reverse proxy como Traefik o Caddy delante de nginx.

4. **Configurar backups automáticos** de la base de datos.

---

## 📚 Referencias

- [Documentación oficial de Docker](https://docs.docker.com/)
- [Docker Desktop para Windows](https://docs.docker.com/desktop/install/windows-install/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Node.js en Docker (mejores prácticas)](https://nodejs.org/en/docs/guides/nodejs-docker-webapp)
- [Prisma con Docker](https://www.prisma.io/docs/orm/prisma-client/deployment/docker)
