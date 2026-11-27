import * as historialService from '../services/historial.service.js';
import { enviarPdfTabla } from '../services/historial-pdf.service.js';
import { fechaChilena } from '../utils/fechas.js';

// los controladores solo reciben la petición, llaman al servicio y responden

// GET /api/historial
export const getHistoriales = async (req, res) => {
  const resultado = await historialService.getHistoriales(req.validateQuery);
  res.json(resultado);
};

// GET /api/historial/veterinarios
// lista de nombres (texto) para sugerir mientras se escribe el veterinario
export const getVeterinarios = async (req, res) => {
  res.json(await historialService.getVeterinarios());
};

// "2025-03-06" -> "06-03-2025". Los periodos más cortos ("2025" o "2025-03") se dejan igual.
const periodoChileno = (texto) =>
  texto.length === 10 ? fechaChilena(new Date(`${texto}T00:00:00.000Z`)) : texto;

// GET /api/historial/pdf
// Descarga la tabla del historial en PDF, con los mismos filtros que la tabla de la página.
// Para describir los filtros en el PDF se usa req.query (lo que escribió la persona), porque en
// req.validateQuery las fechas ya vienen convertidas (por ejemplo, "hasta" está corrido al día siguiente).
export const getHistorialPdf = async (req, res) => {
  const { registros, total } = await historialService.getHistorialesParaPdf(req.validateQuery);

  const { animal, veterinario, insumo, desde, hasta } = req.query;
  const descripcionFiltros = [];
  if (animal) descripcionFiltros.push(`Animal: "${animal}"`);
  if (veterinario) descripcionFiltros.push(`Veterinario: "${veterinario}"`);
  if (insumo) descripcionFiltros.push(`Insumo: "${insumo}"`);
  if (desde) descripcionFiltros.push(`Desde: ${periodoChileno(desde)}`);
  if (hasta) descripcionFiltros.push(`Hasta: ${periodoChileno(hasta)}`);

  // Content-Type le dice al navegador que es un PDF.
  // Content-Disposition "attachment" hace que se descargue con ese nombre de archivo.
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="historial-medico-${fechaChilena(new Date())}.pdf"`);
  enviarPdfTabla(res, { registros, descripcionFiltros, total });
};

// GET /api/historial/:id
export const getHistorialById = async (req, res) => {
  const registro = await historialService.getHistorialById(req.params.id);
  if (!registro) return res.status(404).json({ error: 'Registro médico no encontrado' });
  res.json(registro);
};

// POST /api/historial
// req.usuario.rut es quien inició sesión (lo pone requireAuth). Se le pasa al servicio
// para anotarlo como "registrado por" en las salidas del inventario.
export const createHistorial = async (req, res) => {
  const registro = await historialService.createHistorial(req.body, req.usuario.rut);
  res.status(201).json(registro);
};

// PUT /api/historial/:id
export const updateHistorial = async (req, res) => {
  const registro = await historialService.updateHistorial(req.params.id, req.body, req.usuario.rut);
  res.json(registro);
};

// DELETE /api/historial/:id
// Al eliminar, el servicio devuelve los insumos al inventario y anota quién lo hizo.
export const deleteHistorial = async (req, res) => {
  await historialService.deleteHistorial(req.params.id, req.usuario.rut);
  res.status(204).send();
};