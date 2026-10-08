import { crearTurno } from '../services/turno.service.js';
import { obtenerTurnos } from '../services/turno.service.js';

export const crearTurnoController = async (req, res, next) => {
  try {
    const turno = await crearTurno(req.body);
    res.status(201).json(turno);
  } catch (error) {
    next(error);
  }
};

export const obtenerTurnosController = async (req, res) => {
  const turnos = await obtenerTurnos(req, res);
  res.status(200).json(turnos);

  
};
