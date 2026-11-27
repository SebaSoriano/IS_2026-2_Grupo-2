import { crearTurno } from '../services/turno.service.js';
import { actualizarTurno } from '../services/turno.service.js';
import { eliminarTurno } from '../services/turno.service.js';
import { marcarAsistenciaTurno } from '../services/turno.service.js';
import { obtenerTurnoParaLlegada, registrarLlegada } from '../services/turno.service.js';


export const crearTurnoController = async (req, res, next) => {
  try {
    const turno = await crearTurno(req.body, req.usuario);
    res.status(201).json(turno);
  } catch (error) {
    next(error);
  }
};


export const actualizarTurnoController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const turno = await actualizarTurno(id, req.body, req.usuario);
    res.status(200).json(turno);
  } catch (error) {
    next(error);
  }
};

// marca o desmarca que el usuario llego a la hora a su turno
export const marcarAsistenciaTurnoController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const turno = await marcarAsistenciaTurno(id, req.body);
    res.status(200).json(turno);
  } catch (error) {
    next(error);
  }
};

// turno en que la persona de la sesion puede apretar "Llegué" ahora; { turno: null } si no tiene
export const obtenerTurnoParaLlegadaController = async (req, res, next) => {
  try {
    const turno = await obtenerTurnoParaLlegada(req.usuario);
    res.status(200).json({ turno });
  } catch (error) {
    next(error);
  }
};

// registra la llegada de la persona de la sesion a su turno actual
export const registrarLlegadaController = async (req, res, next) => {
  try {
    const turno = await registrarLlegada(req.usuario);
    res.status(200).json(turno);
  } catch (error) {
    next(error);
  }
};

export const eliminarTurnoController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await eliminarTurno(id, req.usuario);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
