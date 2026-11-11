import express from 'express'
import indexRouter from './routes/index.routes.js'
import { errorHandler } from './middlewares/error.middleware.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()

app.use(express.json())
import routes from './routes/index.routes.js';

// Todas las rutas de la API quedan bajo /api
app.use('/api', indexRouter)
// En produccion el frontend lo entrega este mismo servidor:
// asi la pagina y la API comparten dominio y puerto.
const CARPETA_FRONTEND = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'frontend', 'dist')
if (fs.existsSync(path.join(CARPETA_FRONTEND, 'index.html'))) {
  app.use(express.static(CARPETA_FRONTEND))
  // cualquier otra ruta la resuelve React Router en el navegador
  app.get('/{*ruta}', (req, res) => res.sendFile(path.join(CARPETA_FRONTEND, 'index.html')))
}
// Cualquier ruta que no exista responde JSON en vez del HTML por defecto de Express
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))

// Esto siempre al final,
// para que capture cualquier error que haya ocurrido en los controllers o middlewares previos
app.use(errorHandler)

export default app
