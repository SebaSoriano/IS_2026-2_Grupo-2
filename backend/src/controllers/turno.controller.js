import { crearTurno } from '../services/turno.service.js';

export const crearTurnoController = async (req, res, next) => {
  try {
    const turno = await crearTurno(req.body);
    res.status(201).json(turno);
  } catch (error) {
    next(error);
  }
};