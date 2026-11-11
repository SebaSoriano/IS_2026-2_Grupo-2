import express from 'express'
import cookieParser from 'cookie-parser'
import indexRouter from './routes/index.routes.js'
import { errorHandler } from './middlewares/error.middleware.js'
import { CARPETA_FOTOS_ANIMALES } from './config/uploads.js'
import { startExpirationNotifications } from './services/insumo-expiration-notifier.service.js'

const app = express()

app.use(express.json())
// cookie-parser lee el header "Cookie" que manda el navegador
// y deja las cookies como objeto en req.cookies (ej: req.cookies.token)
app.use(cookieParser())

// Archivos subidos (fotos), ej: GET /uploads/animales/animal-5-...jpg
app.use('/uploads/animales', express.static(CARPETA_FOTOS_ANIMALES))

// Todas las rutas de la API quedan bajo /api
app.use('/api', indexRouter)
// Cualquier ruta que no exista responde JSON en vez del HTML por defecto de Express
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))

// Esto siempre al final, 
// para que capture cualquier error que haya ocurrido en los controllers o middlewares previos
app.use(errorHandler)

startExpirationNotifications()

export default app