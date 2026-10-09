import * as donacionesService from '../services/donaciones.service.js';

// POST /api/donaciones
export const createDonacion = async (req, res) => {
  const donacion = await donacionesService.createDonacion(req.body);
  res.status(201).json(donacion);
};

// GET /api/donaciones
export const getDonaciones = async (req, res) => {
  const donaciones = await donacionesService.getAllDonaciones();
  res.json(donaciones);
};

// GET /api/donaciones/:id
export const getDonacionById = async (req, res) => {
  const donacion = await donacionesService.getDonacionById(req.params.id);
  if (!donacion) return res.status(404).json({ error: 'Donación no encontrada' });
  res.json(donacion);
};