import express from 'express'
import indexRouter from './routes/index.routes.js'
const app = express()

app.use(express.json())
import routes from './routes/index.routes.js';
app.use('/api', indexRouter)

export default app  