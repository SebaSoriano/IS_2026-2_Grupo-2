import express from 'express'
const app = express()

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

export default app