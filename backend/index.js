<<<<<<< HEAD
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import router from './src/routes/index.routes.js';
import { errorHandler } from './src/middlewares/error.middleware.js';
import prisma from './src/config/prisma.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', router);

app.use(errorHandler);

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('=> Conexión a PostgreSQL establecida con éxito');

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('=> Error al iniciar el servidor o conectar a PostgreSQL:', error);
    process.exit(1);
  }
}

bootstrap();
=======
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
