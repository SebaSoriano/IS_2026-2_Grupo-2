import multer from 'multer';
import { HttpError } from './error.middleware.js';

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