import { getAnimalesPublicos } from '../services/animales.service.js';

export const getAnimalesPublico = async (req, res) => {
  const animales = await getAnimalesPublicos();
  res.json(animales);
};

// Resumen de salud de un animal para el "Ver detalles" de la página pública
export const getSaludAnimalPublico = async (req, res) => {
  const salud = await getSaludPublica(req.params.id);
  res.json(salud);
};