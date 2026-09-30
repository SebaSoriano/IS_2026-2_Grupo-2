import express from 'express'
import insumosRouter from './src/routes/insumos.routes.js'

const app = express()
const PORT = 3000

app.use(express.json())
app.use('/api/insumos', insumosRouter)

app.listen(PORT, () => {
    console.log(`Server listening in http://localhost:${PORT}`)
})
