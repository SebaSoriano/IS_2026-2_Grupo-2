import { obtenerHorarios } from '../services/horario.service.js';
import { buscarUsuariosPorNombre } from '../services/usuario.service.js';

export const obtenerHorariosController = async (req, res, next) => {
  try {
    const horarios = await obtenerHorarios();
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
