
import * as animalesService from '../services/animales.service.js';
import { HttpError } from '../middlewares/error.middleware.js';

// GET /api/animales
export const getAnimales = async (req, res) => {
  const animales = await animalesService.getAllAnimales(req.validateQuery);
  res.json(animales);
};

// GET /api/animales/:id
export const getAnimalById = async (req, res) => {
  const animal = await animalesService.getAnimalById(req.params.id);
  if (!animal) return res.status(404).json({ error: 'Animal no encontrado' });
  res.json(animal);
};

// POST /api/animales
export const createAnimal = async (req, res) => {
  const animal = await animalesService.createAnimal(req.body);
  res.status(201).json(animal);
};

// PUT /api/animales/:id
export const updateAnimal = async (req, res) => {
  const animal = await animalesService.updateAnimal(req.params.id, req.body);
  res.json(animal);
};

// DELETE /api/animales/:id
export const deleteAnimal = async (req, res) => {
  await animalesService.deleteAnimal(req.params.id);
  res.status(204).send();
};

// POST /api/animales/:id/fotos
export const subirFotosAnimal = async (req, res) => {
  // multer deja los archivos en req.files (un arreglo); si no vino ninguno, es un error
  if (!req.files || req.files.length === 0) {
    throw new HttpError(400, 'Debe adjuntar al menos una imagen en el campo "fotos"');
  }
  const animal = await animalesService.agregarFotosAnimal(req.params.id, req.files);
  res.status(201).json(animal);
};

// DELETE /api/animales/:id/fotos/:idFoto
export const eliminarFotoAnimal = async (req, res) => {
  const animal = await animalesService.eliminarFotoAnimal(req.params.id, req.params.idFoto);
  res.json(animal);
};