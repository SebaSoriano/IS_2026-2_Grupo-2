import express from 'express'
import indexRouter from './routes/index.routes.js'
import { errorHandler } from './middlewares/error.middleware.js'

const app = express()

app.use(express.json())

// Todas las rutas de la API quedan bajo /api
app.use('/api', indexRouter)
// Cualquier ruta que no exista responde JSON en vez del HTML por defecto de Express
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))

// Esto siempre al final, 
// para que capture cualquier error que haya ocurrido en los controllers o middlewares previos
app.use(errorHandler)

export default app