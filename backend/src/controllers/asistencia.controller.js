import { obtenerAsistenciasDelMes } from '../services/asistencia.service.js';

// el mes ya llega validado por Zod en req.validateQuery
export const obtenerAsistenciasController = async (req, res, next) => {
  try {
    const { mes } = req.validateQuery;
    const asistencias = await obtenerAsistenciasDelMes(mes);
    res.status(200).json(asistencias);
  } catch (error) {
    next(error);
  }
};
