# IS_2026-2_Grupo-2 · Stray Paws

Sistema web para la gestión de un refugio de animales: horarios y turnos, adopciones, animales, historial médico, inventario y donaciones.

## Stack

| Parte | Tecnologías |
|---|---|
| Backend | Node.js + Express 5, Prisma ORM 6.19.3, Zod 4 (validación), bcryptjs, Faker |
| Base de datos | PostgreSQL 17 (en local se puede levantar con Docker usando `docker-compose.yml`) |
| Frontend | React 19 + Vite |

## Estructura del proyecto

```text
IS_2026-2_Grupo-2/
├── docker-compose.yml       # contenedor de PostgreSQL para desarrollo local (opcional)
├── backend/
│   ├── index.js             # punto de entrada: carga el .env y arranca el servidor
│   ├── .env.example         # plantilla de variables de entorno
│   ├── prisma/
│   │   ├── schema.prisma    # modelos de la base de datos
│   │   ├── migrations/      # historial de cambios de la base
│   │   └── seed.js          # datos de prueba
│   └── src/
│       ├── server.js        # levanta el servidor en el puerto 3000
│       ├── app.js           # middlewares, rutas bajo /api y manejo de errores
│       ├── config/          # instancia única de Prisma
│       ├── routes/          # definición de rutas REST y qué validaciones usa cada una
│       ├── controllers/     # reciben la petición, llaman al service y responden
│       ├── services/        # lógica de negocio y acceso a datos vía Prisma
│       ├── schemas/         # schemas de Zod con las reglas de los datos de entrada
│       └── middlewares/     # validate (aplica un schema de Zod) y manejo de errores
└── frontend/                # aplicación React + Vite
```

### Cómo fluye una petición

```text
ruta → validate(schema) → controller → service → Prisma → BD
         │                                 │
         └─ 400 si el formato está mal     └─ lanza HttpError (404, 409...) si algo no cuadra
                                              y error.middleware.js lo convierte en la respuesta
```

- **Schema (Zod)**: solo revisa el *formato* de los datos (tipos, largos, RUT, horas…). No consulta la base de datos.
- **`validate.middleware.js`**: es genérico, `validate(schema, 'body' | 'params' | 'query')` sirve para cualquier ruta. Si los datos pasan, deja en `req` los datos ya limpios y transformados.
- **Service**: las reglas de negocio que necesitan la base (que el usuario exista, que dos turnos no se crucen, etc.).

## Requisitos

- [Node.js](https://nodejs.org/) 20.6 o superior
- Una base de datos PostgreSQL. Si no tienes una, puedes levantarla con [Docker Desktop](https://www.docker.com/products/docker-desktop/) (opcional, ver paso 1)
- [Postman](https://www.postman.com/) para probar la API (o la extensión Thunder Client de VS Code)

## Primera vez

Sigue los pasos en orden y fíjate en la carpeta desde donde se ejecuta cada comando. Todos los comandos de Prisma y de npm del backend se ejecutan **dentro de `backend/`**, nunca desde la raíz.

### 1. Levantar la base de datos (opcional, con Docker)

El backend se conecta a la base que indique la `DATABASE_URL` del `.env`, esté donde esté. Si ya tienes un PostgreSQL al que conectarte, sáltate este paso y pon sus credenciales en el paso 3.

Si no tienes una base, puedes levantar una local con Docker. Con Docker Desktop abierto, desde la **raíz** del proyecto:

```bash
docker compose up -d
```

Crea el contenedor `proyecto_db` con PostgreSQL 17 (usuario `admin`, contraseña `admin123`, base `refugio`, puerto `5432`). Los datos se guardan en un volumen, así que no se pierden al apagar el contenedor.

### 2. Instalar dependencias del backend

Desde `backend/`:

```bash
npm install
```

Esto instala Prisma 6.19.3, la versión fijada en `package.json`. Sin este paso, `npx` descargará otra versión de Prisma y los comandos fallarán.

### 3. Configurar variables de entorno

Desde `backend/`, crea tu `.env` copiando la plantilla:

```bash
cp .env.example .env
```

La plantilla ya trae la `DATABASE_URL` que coincide con el `docker-compose.yml`. Si usas otra base, cámbiala con el formato:

```text
DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BD"
```

### 4. Aplicar las migraciones

Desde `backend/`:

```bash
npx prisma migrate dev
```

El repositorio trae las migraciones, pero tu base local no las tiene hasta que ejecutas este comando: crea todas las tablas.

> ⚠️ No ejecutes `npx prisma migrate dev --name init`: esa migración ya existe.

### 5. Poblar la base con datos de prueba

Desde `backend/`:

```bash
npx prisma db seed
```

El seed borra los datos anteriores y crea:

- **Roles** con ids fijos: `1` Admin, `2` Veterinaria, `3` Voluntario.
- **4 usuarios**: `11111111-1` (Admin), `22222222-2`, `12123123-2` y `44444444-4` (Voluntarios). Todos tienen la contraseña de prueba `admin1234`.
- **7 horarios**, uno por día de la semana: el id es el día (`1` Lunes … `7` Domingo).
- **Turnos** al azar para cada usuario, con bloques de una hora entre las 08:00 y las 20:00.
- **12 insumos** de ejemplo.

No crea animales: para probar ese módulo, créalos primero con la API (ver ejemplos más abajo). El seed se puede ejecutar las veces que quieras.

> Aparecerá un aviso amarillo de que `package.json#prisma` está deprecado. Es esperado con Prisma 6 y se puede ignorar.

### 6. Levantar el backend

Desde `backend/`:

```bash
npm run dev
```

Esto ejecuta `node --watch index.js`, que reinicia el servidor cada vez que guardas un archivo. La API queda en `http://localhost:3000/api`. Para comprobar que responde, abre en el navegador:

```text
http://localhost:3000/api/health
```

Debería devolver `{ "status": "OK", ... }`.

### 7. Levantar el frontend

En **otra terminal**, desde `frontend/`:

```bash
npm install
npm run dev
```

La aplicación se abre en `http://localhost:5173`. Vite redirige las peticiones a `/api` hacia el backend en el puerto 3000, así que el backend debe estar corriendo.

## Uso diario

Una vez hecha la instalación, para trabajar solo necesitas que tu base de datos esté corriendo (si usas Docker, basta con tener Docker Desktop abierto: el contenedor se levanta solo) y:

| Terminal | Carpeta | Comando |
|---|---|---|
| 1 | `backend/` | `npm run dev` |
| 2 | `frontend/` | `npm run dev` |

Después de cada `git pull`:

- Si cambió algún `package.json`, ejecuta `npm install` en esa carpeta.
- Si llegaron migraciones nuevas, ejecuta `npx prisma migrate dev` en `backend/`.
- Si Prisma te pide resetear la base (pasa cuando una migración cambia tablas que ya tienen datos), ejecuta `npx prisma migrate reset` en `backend/`: borra todo, aplica las migraciones y vuelve a ejecutar el seed. Solo hay datos de prueba, así que no se pierde nada importante.

## Probar la API

Con el backend corriendo, envía peticiones desde Postman (o Thunder Client en VS Code, que funciona igual). Las peticiones con datos (`POST`, `PUT`, `PATCH`) llevan el body en formato JSON.

Formatos que valida la API:

- **RUT**: sin puntos y con guion, por ejemplo `12345678-9`. Una `k` minúscula se convierte a `K`.
- **Fechas**: texto en formato `AAAA-MM-DD`.
- **Teléfono**: entre 8 y 15 dígitos, puede empezar con `+`.
- **Día (`horario_id`)**: número del `1` (Lunes) al `7` (Domingo).
- **Horas de un turno**: bloques de una hora con formato `HH:00`. La llegada (`hora_inicio`) va de `08:00` a `19:00` y la salida (`hora_fin`, opcional) de `09:00` a `20:00`.

Los errores responden JSON con la forma `{ "error": "mensaje" }`. Cuando falla la validación de Zod, la respuesta es `400` e indica qué campo falló:

```json
{
  "error": "Error de validación de los datos enviados",
  "details": [
    { "campo": "hora_inicio", "mensaje": "Debe ser un bloque de una hora con formato HH:00" }
  ]
}
```

### Endpoints disponibles

**General**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Comprueba que el servidor responde |

**Autenticación**

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Inicia sesión con `rut_usuario` y `contrasena` |
| POST | `/api/auth/logout` | Cierra la sesión |
| POST | `/api/auth/register` | Crea un usuario |

**Horarios**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/horarios` | Los 7 días de la semana, cada uno con sus turnos ordenados por hora y el usuario de cada turno |

**Turnos**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/turnos` | Lista todos los turnos, ordenados por día y hora |
| GET | `/api/turnos/:rut` | Turnos de un usuario (`404` si el usuario no existe) |
| POST | `/api/turnos` | Asigna un usuario a un bloque horario de un día |
| PUT | `/api/turnos/:id` | Modifica un turno: usuario, día u horas (basta con enviar los campos que cambian) |
| DELETE | `/api/turnos/:id` | Elimina un turno |

Un usuario puede tener varios turnos el mismo día, pero no pueden cruzarse (responde `409`). Si un turno no tiene `hora_fin`, dura solo su bloque de una hora.

**Animales**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/animales` | Lista los animales. Filtros opcionales: `?especie=perro`, `?adoptado=true` o `false` |
| GET | `/api/animales/:id` | Detalle de un animal, con su adopción e historial médico |
| POST | `/api/animales` | Crea un animal |
| PUT | `/api/animales/:id` | Modifica un animal (basta con enviar los campos que cambian) |
| DELETE | `/api/animales/:id` | Elimina un animal, solo si no tiene adopciones ni historial médico |
| POST | `/api/animales/:id/adopcion` | Registra la adopción de un animal (crea también el adoptante) |

**Adopciones**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/adopciones` | Lista las adopciones, de la más reciente a la más antigua |

**Insumos**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/insumos` | Lista los insumos con el usuario que los registró |
| GET | `/api/insumos/:id` | Detalle de un insumo |
| POST | `/api/insumos` | Crea un insumo |
| PUT / PATCH | `/api/insumos/:id` | Modifica un insumo (basta con enviar los campos que cambian) |
| DELETE | `/api/insumos/:id` | Elimina un insumo |

### Ejemplos en Postman

Para cada petición: elige el método en el selector de la izquierda, pega la URL y, si la petición lleva datos, ve a la pestaña **Body**, marca **raw** y selecciona **JSON** en el desplegable de la derecha. Postman agrega solo el header `Content-Type: application/json`. Luego presiona **Send**; la respuesta y su código aparecen en la parte inferior.

**Comprobar que el servidor responde**

- Método: `GET`
- URL: `http://localhost:3000/api/health`
- Body: ninguno

**Iniciar sesión**

- Método: `POST`
- URL: `http://localhost:3000/api/auth/login`
- Body (raw → JSON):

```json
{
  "rut_usuario": "11111111-1",
  "contrasena": "admin1234"
}
```

Con datos incorrectos responde `401`.

**Ver el horario de la semana**

- Método: `GET`
- URL: `http://localhost:3000/api/horarios`
- Body: ninguno

Cada turno de la respuesta trae su `id`, que se usa para editarlo o borrarlo.

**Asignar un turno**

- Método: `POST`
- URL: `http://localhost:3000/api/turnos`
- Body (raw → JSON):

```json
{
  "rut_usuario": "22222222-2",
  "horario_id": 2,
  "hora_inicio": "08:00",
  "hora_fin": "10:00"
}
```

Asigna al usuario el martes de 08:00 a 10:00. `hora_fin` es opcional: si solo se registra la hora de llegada, se omite. Responde `201` con el turno creado. Varias personas pueden estar en el mismo bloque, pero si el turno se cruza con otro de la misma persona ese día responde `409`.

**Cambiar un turno de día**

- Método: `PUT`
- URL: `http://localhost:3000/api/turnos/5` (reemplaza `5` por el id del turno)
- Body (raw → JSON), solo con los campos que cambian:

```json
{
  "horario_id": 3,
  "hora_inicio": "08:00"
}
```

Mueve el turno al miércoles a las 08:00. Para quitar la hora de salida, envía `"hora_fin": null`.

**Borrar un turno**

- Método: `DELETE`
- URL: `http://localhost:3000/api/turnos/5` (reemplaza `5` por el id del turno)
- Body: ninguno

Responde `204` sin contenido si se eliminó.

**Crear un animal**

- Método: `POST`
- URL: `http://localhost:3000/api/animales`
- Body (raw → JSON):

```json
{
  "especie_animal": "Perro",
  "via_ingreso": "Rescate",
  "edad": 3,
  "peso_animal": 12.5,
  "observaciones_animal": "Muy sociable"
}
```

Campos obligatorios: `especie_animal`, `via_ingreso`, `edad` (entero de 0 a 40) y `peso_animal` (en kg). `observaciones_animal` es opcional. La respuesta incluye el `id_animal` asignado, que necesitas para los siguientes ejemplos.

**Listar animales con filtros**

- Método: `GET`
- URL: `http://localhost:3000/api/animales?especie=perro&adoptado=false`
- Body: ninguno

También puedes agregar los filtros en la pestaña **Params** en vez de escribirlos en la URL.

**Modificar un animal**

- Método: `PUT`
- URL: `http://localhost:3000/api/animales/1` (reemplaza `1` por el id del animal)
- Body (raw → JSON), solo con los campos que cambian:

```json
{
  "peso_animal": 13.2
}
```

**Registrar la adopción de un animal**

- Método: `POST`
- URL: `http://localhost:3000/api/animales/1/adopcion` (reemplaza `1` por el id del animal)
- Body (raw → JSON):

```json
{
  "fecha_adopcion": "2026-09-30",
  "rut_usuario": "22222222-2",
  "nombre_adoptante": "María Pérez",
  "direccion": "Av. Siempre Viva 123",
  "telefono": "912345678",
  "correo": "maria@correo.cl",
  "fecha_nacimiento": "1990-05-10"
}
```

`rut_usuario` es el voluntario que registra la adopción, y `observaciones_adoptante` es opcional. Un animal solo se puede adoptar una vez: si repites la petición, responde `409`.

**Crear un insumo**

- Método: `POST`
- URL: `http://localhost:3000/api/insumos`
- Body (raw → JSON):

```json
{
  "tipo_insumo": "Alimento",
  "fecha_ingreso": "2026-09-30",
  "cantidad": 20,
  "rut_usuario": "11111111-1"
}
```

Campos obligatorios: `tipo_insumo`, `fecha_ingreso`, `cantidad` y `rut_usuario`. Opcionales: `fecha_vencimiento` y `descripcion`.

**Eliminar un insumo**

- Método: `DELETE`
- URL: `http://localhost:3000/api/insumos/1` (reemplaza `1` por el id del insumo)
- Body: ninguno

Responde `204` sin contenido si se eliminó.

> Los ids de turnos, animales e insumos dependen de lo que exista en tu base. Revísalos en Prisma Studio antes de probar.

> 💡 Guarda cada petición en una colección de Postman (botón **Save**) para no tener que escribirlas de nuevo. Si el grupo exporta esa colección al repositorio, todos pueden importarla y probar la API al instante.

### Códigos de respuesta

| Código | Significado |
|---|---|
| `200` / `201` | Operación exitosa / registro creado |
| `204` | Eliminado correctamente (sin contenido) |
| `400` | Datos inválidos (validación de Zod), JSON mal formado, o el registro relacionado no existe (por ejemplo, un RUT que no está en la base) |
| `401` | RUT o contraseña inválidos al iniciar sesión |
| `404` | El recurso o la ruta no existe |
| `409` | Conflicto: registro duplicado, turno que se cruza con otro del mismo usuario, animal ya adoptado, o animal con historial que no se puede borrar |
| `500` | Error interno del servidor |

## Ver la base de datos

**Prisma Studio** (interfaz en el navegador), desde `backend/`:

```bash
npx prisma studio
```

Se abre en `http://localhost:5555`, con todas las tablas y sus datos.

## Cambios en la base de datos

Si modificas `backend/prisma/schema.prisma`, crea una migración con un nombre que describa el cambio (minúsculas y guiones bajos):

```bash
npx prisma migrate dev --name agrega_tabla_insumos
```

Sube al repositorio, en el mismo commit, el `schema.prisma` y la nueva carpeta en `prisma/migrations/`. Nunca edites a mano una migración que ya está en el repositorio. Si el cambio afecta al seed (por ejemplo, una columna nueva obligatoria), actualiza también `prisma/seed.js`.

Si la migración falla porque agregaste una columna obligatoria a una tabla con datos, en desarrollo puedes reiniciar la base (borra todo, aplica las migraciones y ejecuta el seed):

```bash
npx prisma migrate reset
```

## Producción (servidor)

En el servidor **no se usa** `docker-compose.yml`: la base de datos ya está montada allí. Solo hay que apuntar el backend a ella.

1. En `backend/.env` del servidor, pon la `DATABASE_URL` con las credenciales asignadas para la base del servidor.
2. Desde `backend/`, instala las dependencias y aplica las migraciones:

    ```bash
    npm install
    npx prisma migrate deploy
    ```

    `migrate deploy` solo aplica las migraciones pendientes: no crea migraciones nuevas ni pide resetear la base.

> ⚠️ En producción **nunca** ejecutes `npx prisma migrate dev`, `npx prisma migrate reset` ni `npx prisma db seed`. El reset borra la base completa y el seed empieza borrando todas las tablas para cargar datos de prueba: se perderían los datos reales.

## Agregar validaciones a un endpoint

1. Crea o edita el schema en `backend/src/schemas/` con Zod:

    ```js
    import { z } from 'zod';

    export const createEjemploSchema = z.object({
      nombre: z.string().trim().min(2, 'Debe tener al menos 2 caracteres'),
      cantidad: z.number().int().positive(),
    });
    ```

2. Úsalo en la ruta con el middleware `validate`, indicando qué parte de la petición se valida:

    ```js
    router.post('/', validate(createEjemploSchema, 'body'), crearEjemploController);
    router.get('/:id', validate(idParamSchema, 'params'), obtenerEjemploController);
    ```

Schemas reutilizables que ya existen: `idParamSchema` (valida y convierte el `:id` a número) y `rut` / `rutParamSchema` en `usuario.schema.js`. Los mensajes de error de Zod salen en español y, si falta un campo, dicen "Campo obligatorio".

## Problemas frecuentes

| Error | Causa y solución |
|---|---|
| `Environment variable not found: DATABASE_URL` | Falta el archivo `backend/.env`, o el servidor se ejecutó desde otra carpeta. Ejecuta los comandos desde `backend/`. |
| `Can't reach database server at ...` | La base de datos no está corriendo o la `DATABASE_URL` está mal. Si usas Docker, abre Docker Desktop y ejecuta `docker compose up -d` desde la raíz. |
| `Drift detected` o Prisma pide resetear la base | Tu base no coincide con las migraciones (por ejemplo, después de un `git pull` que cambió tablas). Ejecuta `npx prisma migrate reset` en `backend/`. |
| `Cannot find module '...'` al levantar el backend | Un archivo importado no existe: falta hacer `npm install` o alguien olvidó subir un archivo. El error indica qué archivo lo importa. |
| `400` con "La relacion indicada no es valida" | El usuario, horario o animal indicado no existe en la base. Ejecuta el seed o revisa los ids en Prisma Studio. |
| `EADDRINUSE: address already in use :::3000` | Ya hay un backend corriendo en otra terminal. Ciérralo con Ctrl+C antes de levantar otro. |
