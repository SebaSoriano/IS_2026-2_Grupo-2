import {
  createInsumo as createInsumoRecord,
  deleteInsumo as deleteInsumoRecord,
  getAllInsumos,
  getInsumoById,
  getMovimientos,
  terminarEnvase as terminarEnvaseRecord,
  updateInsumo as updateInsumoRecord,
} from '../services/insumo.service.js';
import { isLowStock, sendLowStockNotification } from '../services/email.service.js';

async function notifyLowStock(insumo) {
  try {
    await sendLowStockNotification(insumo);
  } catch (error) {
    console.error(`No se pudo enviar el aviso de stock bajo del insumo ${insumo.id}:`, error);
  }
}

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

// GET /api/insumos/movimientos
// salidas y devoluciones del inventario, de la más reciente a la más antigua
export async function listMovimientos(req, res) {
  try {
    res.json(await getMovimientos());
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
    const previousInsumo = await getInsumoById(id);
    if (!previousInsumo) return res.status(404).json({ error: 'Insumo no encontrado' });

    const insumo = await updateInsumoRecord(id, req.body);
    if (!isLowStock(previousInsumo.cantidad) && isLowStock(insumo.cantidad)) {
      await notifyLowStock(insumo);
    }
    return res.json(insumo);
  } catch (error) {
    return handleDatabaseError(error, res);
  }
}

// PATCH /api/insumos/:id/terminar
// Marca que se terminó el envase en uso de un insumo de tipo "estado"
export async function terminarEnvase(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'El id debe ser un entero positivo' });

  const insumo = await terminarEnvaseRecord(id, req.usuario.rut);
  // mismo aviso por correo que al editar: solo si con este envase PASÓ a stock bajo
  if (!isLowStock(insumo.cantidad + 1) && isLowStock(insumo.cantidad)) {
    await notifyLowStock(insumo);
  }
  return res.json(insumo);
}

export async function removeInsumo(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'El id debe ser un entero positivo' });

  try {
    await deleteInsumoRecord(id);
    return res.status(204).end();
  } catch (error) {
    // P2003 al borrar significa que otra tabla todavía apunta a este insumo
    if (error.code === 'P2003') {
      return res.status(409).json({
        error: 'No se puede eliminar el insumo porque se usó en registros del historial médico',
      });
    }
    return handleDatabaseError(error, res);
  }
}