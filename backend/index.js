express = require('express')
const app = express()
const PORT = 3000

app.use(express.json())

let mascotas = [
    {nombre: 'Firulais', tipo: 'perro', edad: 3},
    {nombre: 'Miau', tipo: 'gato', edad: 2}
]

app.listen(PORT, () => {
    console.log(`Server listening in http://localhost:${PORT}`)
})