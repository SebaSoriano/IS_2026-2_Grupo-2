import * as adopcionesService from '../services/adopciones.service.js';

// ---------- Públicas ----------

// GET /api/adopciones/animales/:id
export const getAnimalParaAdoptar = async (req, res) => {
  const animal = await adopcionesService.getAnimalParaAdoptar(req.params.id);
  res.json(animal);
};

// POST /api/adopciones/solicitudes
export const createSolicitudPublica = async (req, res) => {
  // req.file es el PDF que dejó el middleware recibirCertificado
  const solicitud = await adopcionesService.crearSolicitudPublica(req.body, req.file);
  res.status(201).json(solicitud);
};

// ---------- Intranet ----------

// GET /api/adopciones
export const getAdopciones = async (req, res) => {
  const adopciones = await adopcionesService.getAllAdopciones();
  res.json(adopciones);
};

// GET /api/adopciones/solicitudes
export const getSolicitudes = async (req, res) => {
  const solicitudes = await adopcionesService.getSolicitudes();
  res.json(solicitudes);
};

// POST /api/adopciones/solicitudes/manual
export const createSolicitudManual = async (req, res) => {
  const solicitud = await adopcionesService.crearSolicitudManual(req.body);
  res.status(201).json(solicitud);
};

// GET /api/adopciones/adoptantes
export const getAdoptantes = async (req, res) => {
  const adoptantes = await adopcionesService.getAdoptantes();
  res.json(adoptantes);
};

// GET /api/adopciones/adoptantes/:id/certificado
// res.sendFile envía el archivo; por la extensión .pdf el navegador lo abre como PDF
export const getCertificado = async (req, res) => {
  res.sendFile(await adopcionesService.getCertificado(req.params.id));
};

// POST /api/adopciones/solicitudes/existente
export const createSolicitudExistente = async (req, res) => {
  const solicitud = await adopcionesService.crearSolicitudExistente(req.body);
  res.status(201).json(solicitud);
};

// PATCH /api/adopciones/solicitudes/:id/visita
export const agendarVisita = async (req, res) => {
  const solicitud = await adopcionesService.agendarVisita(req.params.id, req.body.fecha_visita);
  res.json(solicitud);
};

// PATCH /api/adopciones/solicitudes/:id/rechazar
export const rechazarSolicitud = async (req, res) => {
  const solicitud = await adopcionesService.rechazarSolicitud(req.params.id);
  res.json(solicitud);
};

// PATCH /api/adopciones/solicitudes/:id/adoptar
// req.usuario.rut lo deja requireAuth: es quien registra la adopción
export const marcarAdoptado = async (req, res) => {
  const adopcion = await adopcionesService.marcarAdoptado(req.params.id, req.usuario.rut);
  res.status(201).json(adopcion);
};