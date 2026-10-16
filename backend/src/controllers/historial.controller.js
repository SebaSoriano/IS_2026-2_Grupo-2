import * as historialService from '../services/historial.service.js';

// los controladores solo reciben la petición, llaman al servicio y responden

// GET /api/historial
export const getHistoriales = async (req, res) => {
  const resultado = await historialService.getHistoriales(req.validateQuery);
  res.json(resultado);
};

// GET /api/historial/:id
export const getHistorialById = async (req, res) => {
  const registro = await historialService.getHistorialById(req.params.id);
  if (!registro) return res.status(404).json({ error: 'Registro médico no encontrado' });
  res.json(registro);
};

// POST /api/historial
export const createHistorial = async (req, res) => {
  const registro = await historialService.createHistorial(req.body);
  res.status(201).json(registro);
};

// PUT /api/historial/:id
export const updateHistorial = async (req, res) => {
  const registro = await historialService.updateHistorial(req.params.id, req.body);
  res.json(registro);
};

// DELETE /api/historial/:id
export const deleteHistorial = async (req, res) => {
  await historialService.deleteHistorial(req.params.id);
  res.status(204).send();
};