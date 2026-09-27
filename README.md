## Requisitos

- [Docker](https://www.docker.com/) (Docker Desktop en Windows/Mac)
- [Node.js](https://nodejs.org/)

## Primera vez

### 1. Levantar la base de datos en local 

El docker compose lo ocupamos para no tener que ejecutar un docker run gigante. El docker compose se compone de servicios, en nuestro caso es 1 solo servicio/contenedor que tiene la configuracion de la base de datos.

Desde la **raíz** del proyecto:

```bash
docker compose up -d
```

`-d` lo deja corriendo en segundo plano.

### 2. Instalar dependencias

Desde `backend/`:

```bash
npm install
```

Esto instala Prisma 6, la versión definida en `package.json`. Sin este paso `npx` descargara otra versión de Prisma y los comandos fallarán.

### 3. Configurar variables de entorno

Crea un archivo `backend/.env` a partir de `backend/.env.example` con la conexión a la base.

### 4. Aplicar las migraciones

Desde `backend/`:

```bash
npx prisma migrate dev
```

El repositorio ya trae las migraciones, pero la base de datos local que levantas con docker compose no las tiene hasta que ejecutas este comando. Hay que repetirlo cada vez que hagas pull y lleguen migraciones nuevas.

> ⚠️ No ejecutes `npx prisma migrate dev --name init`: esa migración ya existe.

## Cambios en la base de datos

Si modificas `backend/prisma/schema.prisma`, crea una migración nueva con un nombre que describa el cambio (minúsculas y guiones bajos):

```bash
npx prisma migrate dev --name agrega_tabla_insumos
```

cada vez deberias subir al repositorio tanto el `schema.prisma` como la nueva carpeta en `prisma/migrations/`.

## Comandos útiles de Docker

| Comando | Qué hace |
|---|---|
| `docker compose ps` | Muestra los contenedores levantados |
| `docker compose stop` | Detiene los contenedores (se pueden volver a iniciar con `up -d`) |
| `docker compose down` | Elimina los contenedores, pero conserva los datos |
| `docker compose down -v` | Elimina los contenedores **y los datos** de la base |