import {
  createInsumo as createInsumoRecord,
  deleteInsumo as deleteInsumoRecord,
  getAllInsumos,
  getInsumoById,
  updateInsumo as updateInsumoRecord,
} from '../services/insumo.service.js';

function parseId(value) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function handleDatabaseError(error, res) {
  if (error.code === 'P2003') {
    return res.status(400).json({ error: 'El usuario indicado no existe' });
  }
  if (error.code === 'P2025') {
    return res.status(404).json({ error: 'Insumo no encontrado' });
  }
  return res.status(500).json({ error: 'Error interno al procesar el insumo' });
}

export async function listInsumos(req, res) {
  try {
    res.json(await getAllInsumos());
  } catch (error) {
    handleDatabaseError(error, res);
  }
}

export async function getInsumo(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'El id debe ser un entero positivo' });

  try {
    const insumo = await getInsumoById(id);
    if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado' });
    return res.json(insumo);
  } catch (error) {
    return handleDatabaseError(error, res);
  }
}

export async function createInsumo(req, res) {
  try {
    const insumo = await createInsumoRecord(req.body);
    return res.status(201).json(insumo);
  } catch (error) {
    return handleDatabaseError(error, res);
  }
}

export async function updateInsumo(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'El id debe ser un entero positivo' });

  try {
    const insumo = await updateInsumoRecord(id, req.body);
    return res.json(insumo);
  } catch (error) {
    return handleDatabaseError(error, res);
  }
}

export async function removeInsumo(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'El id debe ser un entero positivo' });

  try {
    await deleteInsumoRecord(id);
    return res.status(204).end();
  } catch (error) {
    return handleDatabaseError(error, res);
  }
}