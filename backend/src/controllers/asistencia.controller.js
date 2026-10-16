import { obtenerAsistenciasDelMes } from '../services/asistencia.service.js';
import { crearAsistencia } from '../services/asistencia.service.js';
import { eliminarAsistencia } from '../services/asistencia.service.js';

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

export const crearAsistenciaController = async (req, res, next) => {
  try {
    const asistencia = await crearAsistencia(req.body);
    res.status(201).json(asistencia);
  } catch (error) {
    next(error);
  }
};

export const eliminarAsistenciaController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await eliminarAsistencia(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
