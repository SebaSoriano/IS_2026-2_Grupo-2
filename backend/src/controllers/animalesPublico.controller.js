import { getAnimalesPublicos } from '../services/animales.service.js';

export const getAnimalesPublico = async (req, res) => {
  const animales = await getAnimalesPublicos();
  res.json(animales);
};