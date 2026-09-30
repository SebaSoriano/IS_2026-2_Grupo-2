import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: [${req.method}] ${req.originalUrl}` });
});

app.use(errorHandler);

export default app;