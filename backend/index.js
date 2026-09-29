express = require('express')
const app = express()
const PORT = 3000

app.use(express.json())

let mascotas = [
    {nombre: 'Firulais', tipo: 'perro', edad: 3},
    {nombre: 'Miau', tipo: 'gato', edad: 2}
]

app.get('/mascotas', (req, res) => {
    res.json(mascotas)
})

app.post('/mascotas', (req, res) => {
    const {nombre, tipo, edad} = req.body
    mascotas.push({nombre, tipo, edad})
    res.json({message: 'Mascota agregada'})
})

app.listen(PORT, () => {
    console.log(`Server listening in http://localhost:${PORT}`)
})
>>>>>>> dev
