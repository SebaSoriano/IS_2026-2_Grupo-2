import crypto from 'crypto';
import multer from 'multer';
import { CARPETA_FOTOS_ANIMALES } from '../config/uploads.js';
import { HttpError } from './error.middleware.js';

// Tipos de imagen permitidos y la extensión que se usa al guardarlos
const TIPOS_PERMITIDOS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// Tamaño máximo: 3 MB (en bytes)
const TAMANO_MAXIMO = 3 * 1024 * 1024;

// Dónde y con qué nombre se guarda cada archivo
const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CARPETA_FOTOS_ANIMALES);
  },
  filename: (req, file, cb) => {
    // Nombre único, ej: animal-5-1730600000000-a1b2c3d4.jpg
    const extension = TIPOS_PERMITIDOS[file.mimetype];
    const aleatorio = crypto.randomUUID().slice(0, 8);
    cb(null, `animal-${req.params.id}-${Date.now()}-${aleatorio}${extension}`);
  },
});

// Solo deja pasar imágenes JPG, PNG o WEBP
function soloImagenes(req, file, cb) {
  if (TIPOS_PERMITIDOS[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new HttpError(400, 'La foto debe ser una imagen JPG, PNG o WEBP'));
  }
}

// Middleware que recibe UN archivo en el campo "foto" y lo deja en req.file
export const recibirFotoAnimal = multer({
  storage: almacenamiento,
  fileFilter: soloImagenes,
  limits: { fileSize: TAMANO_MAXIMO },
}).single('foto');

// El archivo llega a memoria (req.file.buffer) y solo se escribe en disco cuando todo lo demás es válido
const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB, un archivo
});

// El campo del formulario se llama "comprobante". Si la petición no es JSON o multipart, no hace nada.
export const recibirComprobante = (req, res, next) => {
  subida.single('comprobante')(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') return next(new HttpError(413, 'El comprobante no puede superar los 5 MB'));
    if (error.code === 'LIMIT_UNEXPECTED_FILE' || error.code === 'LIMIT_FILE_COUNT') {
      return next(new HttpError(400, 'Envía un solo archivo en el campo "comprobante"'));
    }
    next(error);
  });
};