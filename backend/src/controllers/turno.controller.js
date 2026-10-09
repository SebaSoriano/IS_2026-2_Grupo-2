import { crearTurno } from '../services/turno.service.js';
import { obtenerTurnos } from '../services/turno.service.js';
import { obtenerTurnosPorRut } from '../services/turno.service.js';
import { actualizarTurno } from '../services/turno.service.js';
import { eliminarTurno } from '../services/turno.service.js';


export const crearTurnoController = async (req, res, next) => {
  try {
    const turno = await crearTurno(req.body);
    res.status(201).json(turno);
  } catch (error) {
    next(error);
  }
};


export const obtenerTurnosController = async (req, res, next) => {
  try {
    const turnos = await obtenerTurnos();
    res.status(200).json(turnos);
  } catch (error) {
    next(error);
  }
};

// el rut ya llega validado por Zod, si el usuario no existe el service lanza un 404
export const obtenerTurnosPorRutController = async (req, res, next) => {
  try {
    const { rut } = req.params;
    const turnos = await obtenerTurnosPorRut(rut);
    res.status(200).json(turnos);
  } catch (error) {
    next(error);
  }
};

export const actualizarTurnoController = async (req, res, next) => {
  try {
    const { rut, horario_id } = req.params;
    const turno = await actualizarTurno(rut, horario_id, req.body);
    res.status(200).json(turno);
  } catch (error) {
    next(error);
  }
};

export const eliminarTurnoController = async (req, res, next) => {
  try {
    const { rut, horario_id } = req.params;
    await eliminarTurno(rut, horario_id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
