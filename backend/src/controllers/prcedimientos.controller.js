import * as procedimientosService from '../services/procedimientos.service.js';

// los controladores solo reciben la petición, llaman al servicio y responden

// GET /api/procedimientos
export const getProcedimientos = async (req, res) => {
  res.json(await procedimientosService.getProcedimientos());
};

// POST /api/procedimientos
// Responde 201 (creado) con el procedimiento nuevo, que ya trae su id_procedimiento.
export const createProcedimiento = async (req, res) => {
  const procedimiento = await procedimientosService.createProcedimiento(req.body);
  res.status(201).json(procedimiento);
};

// DELETE /api/procedimientos/:id
// 204 significa "se hizo, pero no hay nada que devolver".
export const deleteProcedimiento = async (req, res) => {
  await procedimientosService.deleteProcedimiento(req.params.id);
  res.status(204).send();
};