# IS_2026-2_Grupo-2 · Stray Paws

Sistema web para la gestión de un refugio de animales: horarios y turnos, adopciones, animales, historial médico, inventario y donaciones.

## Stack

| Parte | Tecnologías |
|---|---|
| Backend | Node.js + Express 5, PostgreSQL + Prisma ORM 6.19.3, Faker |
| Frontend | React 19 + Vite |

## Estructura del proyecto

```text
IS_2026-2_Grupo-2/
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
│       ├── routes/          # definición de rutas REST
│       ├── controllers/     # lógica de cada endpoint
│       ├── services/        # acceso a datos vía Prisma
│       ├── schemas/         # reglas de validación de los datos de entrada
│       └── middlewares/     # validación y manejo de errores
└── frontend/                # aplicación React + Vite
```

## Requisitos

- [Node.js](https://nodejs.org/) 20.6 o superior
- [Postman](https://www.postman.com/) para probar la API (o la extensión Thunder Client de VS Code)

## Primera vez

Sigue los pasos en orden y fíjate en la carpeta desde donde se ejecuta cada comando. Todos los comandos de Prisma y de npm del backend se ejecutan **dentro de `backend/`**, nunca desde la raíz.



### 1. Instalar dependencias del backend

Desde `backend/`:

```bash
npm install
```

Esto instala Prisma 6.19.3, la versión fijada en `package.json`. Sin este paso, `npx` descargará otra versión de Prisma y los comandos fallarán.

### 2. Configurar variables de entorno

Desde `backend/`, crea tu `.env` copiando la plantilla:

```bash
cp .env.example .env
```



### 3. Aplicar las migraciones

Desde `backend/`:

```bash
npx prisma migrate dev
```

El repositorio trae las migraciones, pero tu base local no las tiene hasta que ejecutas este comando: crea todas las tablas.

> ⚠️ No ejecutes `npx prisma migrate dev --name init`: esa migración ya existe.

### 4. Poblar la base con datos de prueba

Desde `backend/`:

```bash
npx prisma db seed
```

El seed borra los datos anteriores y crea:

- **Roles** con ids fijos: `1` Admin, `2` Veterinaria, `3` Voluntario.
- **4 usuarios**: `11111111-1` (Admin), `22222222-2`, `12123123-2` y `44444444-4` (Voluntarios).
- **3 bloques horarios** con fechas de las próximas semanas.

No crea animales ni insumos: para probar esos módulos, créalos primero con la API (ver ejemplos más abajo). El seed se puede ejecutar las veces que quieras.

> Aparecerá un aviso amarillo de que `package.json#prisma` está deprecado. Es esperado con Prisma 6 y se puede ignorar.

### 5. Levantar el backend

Desde `backend/`:

```bash
npm run dev
```

Esto ejecuta `node --watch index.js`, que reinicia el servidor cada vez que guardas un archivo. La API queda en `http://localhost:3000/api`. Para comprobar que responde, abre en el navegador:

```text
http://localhost:3000/api/health
```

Debería devolver `{ "status": "OK", ... }`.

### 6. Levantar el frontend

En **otra terminal**, desde `frontend/`:

```bash
npm install
npm run dev
```

La aplicación se abre en `http://localhost:5173`.

## Uso diario

Una vez hecha la instalación, para trabajar solo necesitas:

| Terminal | Carpeta | Comando |
|---|---|---|
| 1 | `backend/` | `npm run dev` |
| 2 | `frontend/` | `npm run dev` |

Después de cada `git pull`:

- Si cambió algún `package.json`, ejecuta `npm install` en esa carpeta.
- Si llegaron migraciones nuevas, ejecuta `npx prisma migrate dev` en `backend/`.

## Probar la API

Con el backend corriendo, envía peticiones desde Postman (o Thunder Client en VS Code, que funciona igual). Las peticiones con datos (`POST`, `PUT`, `PATCH`) llevan el body en formato JSON.

Formatos que valida la API:

- **RUT**: sin puntos y con guion, por ejemplo `12345678-9`.
- **Fechas**: texto en formato `AAAA-MM-DD`.
- **Teléfono**: entre 8 y 15 dígitos, puede empezar con `+`.

Los errores siempre responden JSON con la forma `{ "error": "mensaje" }`.

### Endpoints disponibles

**General**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Comprueba que el servidor responde |

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

**Turnos**

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/turnos` | Asigna un usuario a un bloque horario |

### Ejemplos en Postman

Para cada petición: elige el método en el selector de la izquierda, pega la URL y, si la petición lleva datos, ve a la pestaña **Body**, marca **raw** y selecciona **JSON** en el desplegable de la derecha. Postman agrega solo el header `Content-Type: application/json`. Luego presiona **Send**; la respuesta y su código aparecen en la parte inferior.

**Comprobar que el servidor responde**

- Método: `GET`
- URL: `http://localhost:3000/api/health`
- Body: ninguno

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

**Asignar un usuario a un bloque horario**

- Método: `POST`
- URL: `http://localhost:3000/api/turnos`
- Body (raw → JSON):

```json
{
  "rut_usuario": "22222222-2",
  "horario_id": 1
}
```

Responde `201` con el turno creado. Varias personas pueden estar en el mismo bloque, pero la misma persona no puede asignarse dos veces al mismo (responde `409`).

> Los ids de horarios, animales e insumos dependen de lo que exista en tu base. Revísalos en Prisma Studio antes de probar.

> 💡 Guarda cada petición en una colección de Postman (botón **Save**) para no tener que escribirlas de nuevo. Si el grupo exporta esa colección al repositorio, todos pueden importarla y probar la API al instante.

### Códigos de respuesta

| Código | Significado |
|---|---|
| `200` / `201` | Operación exitosa / registro creado |
| `204` | Eliminado correctamente (sin contenido) |
| `400` | Datos inválidos, JSON mal formado, o el registro relacionado no existe (por ejemplo, un RUT que no está en la base) |
| `404` | El recurso o la ruta no existe |
| `409` | Conflicto: registro duplicado, animal ya adoptado, o animal con historial que no se puede borrar |
| `500` | Error interno del servidor |

## Ver la base de datos

**Prisma Studio** (interfaz en el navegador), desde `backend/`:

```bash
npx prisma studio
```

Se abre en `http://localhost:5555`, con todas las tablas y sus datos.



Los nombres de tabla con mayúscula van entre comillas dobles.

## Cambios en la base de datos

Si modificas `backend/prisma/schema.prisma`, crea una migración con un nombre que describa el cambio (minúsculas y guiones bajos):

```bash
npx prisma migrate dev --name agrega_tabla_insumos
```

Sube al repositorio, en el mismo commit, el `schema.prisma` y la nueva carpeta en `prisma/migrations/`. Nunca edites a mano una migración que ya está en el repositorio.

Si la migración falla porque agregaste una columna obligatoria a una tabla con datos, en desarrollo puedes reiniciar la base (borra todo, aplica las migraciones y ejecuta el seed):

```bash
npx prisma migrate reset
```



## Problemas frecuentes

| Error | Causa y solución |
|---|---|
| `Environment variable not found: DATABASE_URL` | Falta el archivo `backend/.env`, o el servidor se ejecutó desde otra carpeta. Ejecuta los comandos desde `backend/`. |
| `Cannot find module '...'` al levantar el backend | Un archivo importado no existe: falta hacer `npm install` o alguien olvidó subir un archivo. El error indica qué archivo lo importa. |
| `400` con "La relacion indicada no es valida" | El usuario, horario o animal indicado no existe en la base. Ejecuta el seed o revisa los ids en Prisma Studio. |
| `EADDRINUSE: address already in use :::3000` | Ya hay un backend corriendo en otra terminal. Ciérralo con Ctrl+C antes de levantar otro. |