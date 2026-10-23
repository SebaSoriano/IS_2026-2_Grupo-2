import * as donacionesService from '../services/donaciones.services.js';

export const createDonacionPresencial = async (req, res) => {
  res.status(201).json(await donacionesService.createDonacionPresencial(req.body));
};

export const createDonacionWeb = async (req, res) => {
  res.status(201).json(await donacionesService.createDonacionWeb(req.body));
};

export const getDonaciones = async (req, res) => {
  // validate guarda la query ya validada en req.validateQuery (en Express 5 req.query es de solo lectura)
  res.json(await donacionesService.getAllDonaciones(req.validateQuery));
};

export const getDonacionById = async (req, res) => {
  res.json(await donacionesService.getDonacionById(req.params.id));
};

export const updateDonacion = async (req, res) => {
  res.json(await donacionesService.updateDonacion(req.params.id, req.body));
};

export const agendarDonacion = async (req, res) => {
  res.json(await donacionesService.agendarDonacion(req.params.id, req.body));
};

export const confirmarDonacion = async (req, res) => {
  res.json(await donacionesService.confirmarDonacion(req.params.id, req.body));
};

export const deleteDonacion = async (req, res) => {
  await donacionesService.deleteDonacion(req.params.id);
  res.status(204).end();
};