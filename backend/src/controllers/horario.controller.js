import { obtenerHorarios } from '../services/horario.service.js';
import { buscarUsuariosPorNombre } from '../services/usuario.service.js';

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

// el nombre ya llega validado por Zod en req.validateQuery
export const buscarUsuariosController = async (req, res, next) => {
  try {
    const { nombre } = req.validateQuery;
    const usuarios = await buscarUsuariosPorNombre(nombre);
    res.status(200).json(usuarios);
  } catch (error) {
    next(error);
  }
};
