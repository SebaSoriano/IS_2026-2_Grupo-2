import { obtenerHorarios } from '../services/horario.service.js';
import { listarUsuarios } from '../services/usuario.service.js';

// la semana ya llega validada por Zod en req.validateQuery (si no viene, se usa la semana actual)
export const obtenerHorariosController = async (req, res, next) => {
  try {
    const { semana } = req.validateQuery;
    const horarios = await obtenerHorarios(semana);
    res.status(200).json(horarios);
  } catch (error) {
    next(error);
  }
};

// entrega todos los usuarios para elegir a quien se le asigna un turno
export const listarUsuariosController = async (req, res, next) => {
  try {
    const usuarios = await listarUsuarios();
    res.status(200).json(usuarios);
  } catch (error) {
    next(error);
  }
};
