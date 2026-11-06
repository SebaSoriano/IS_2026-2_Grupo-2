import { randomUUID } from 'node:crypto';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpError } from '../middlewares/error.middleware.js';

// backend/uploads/comprobantes (fuera de src y nunca expuesta como carpeta pública)
const CARPETA = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../uploads/comprobantes');

// Los primeros bytes de un archivo dicen qué es realmente, sin importar lo que declare el navegador
const FIRMAS = [
  { extension: 'png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { extension: 'jpg', bytes: [0xff, 0xd8, 0xff] },
];

const detectarExtension = (buffer) =>
  FIRMAS.find(({ bytes }) => bytes.every((byte, i) => buffer[i] === byte))?.extension;

// Devuelve el nombre del archivo guardado (es lo que va en la columna comprobante_url)
export const guardarComprobante = async (archivo) => {
  const extension = detectarExtension(archivo.buffer);
  if (!extension) throw new HttpError(400, 'El comprobante debe ser una imagen JPG o PNG');

  await mkdir(CARPETA, { recursive: true });
  // nombre aleatorio y extensión decidida por el servidor: el nombre que manda el usuario nunca se usa
  const nombre = `${randomUUID()}.${extension}`;
  await writeFile(path.join(CARPETA, nombre), archivo.buffer);
  return nombre;
};

// path.basename descarta cualquier "../" por si el valor guardado fuera manipulado
export const rutaComprobante = async (nombre) => {
  const ruta = path.join(CARPETA, path.basename(nombre));
  await access(ruta).catch(() => {
    throw new HttpError(404, 'El archivo del comprobante no se encuentra');
  });
  return ruta;
};

export const borrarComprobante = (nombre) =>
  unlink(path.join(CARPETA, path.basename(nombre))).catch(() => {});