import { obtenerHorarios } from '../services/horario.service.js';

export const obtenerHorariosController = async (req, res, next) => {
  try {
    const horarios = await obtenerHorarios();
    res.status(200).json(horarios);
  } catch (error) {
    next(error);
  }
};
