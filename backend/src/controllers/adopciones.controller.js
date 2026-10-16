import * as adopcionesService from '../services/adopciones.service.js';

// POST /api/animales/:id/adopcion
export const createAdopcion = async (req, res) => {
  const adopcion = await adopcionesService.registrarAdopcion(req.params.id, req.body);
  res.status(201).json(adopcion);
};
// GET /api/adopciones
export const getAdopciones = async (req, res) => {
  const adopciones = await adopcionesService.getAllAdopciones();
  res.json(adopciones);
};