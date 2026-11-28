import {
  createConsumoDiario as createConsumoDiarioRecord,
  getConsumosDiarios,
} from '../services/consumo-diario.service.js'

export async function listConsumosDiarios(req, res) {
  res.json(await getConsumosDiarios())
}

export async function createConsumoDiario(req, res) {
  const consumo = await createConsumoDiarioRecord(req.body, req.usuario.rut)
  res.status(201).json(consumo)
}
