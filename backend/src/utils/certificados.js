import { randomUUID } from 'node:crypto';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpError } from '../middlewares/error.middleware.js';

// backend/uploads/certificados: es privada, NO se publica con express.static
// (un certificado de antecedentes es un dato personal: solo lo ve el Admin desde la intranet)
const CARPETA = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../uploads/certificados');

// Todo PDF empieza con los bytes "%PDF-". Se revisa el contenido real del archivo,
// porque el tipo que declara el navegador (o la extensión del nombre) se puede falsificar
const FIRMA_PDF = [0x25, 0x50, 0x44, 0x46, 0x2d];

const esPdf = (buffer) => FIRMA_PDF.every((byte, posicion) => buffer[posicion] === byte);

// Guarda el PDF con un nombre aleatorio y devuelve ese nombre (va en la columna certificado_antecedentes)
export async function guardarCertificado(archivo) {
  if (!esPdf(archivo.buffer)) {
    throw new HttpError(400, 'El certificado de antecedentes debe ser un archivo PDF');
  }
  await mkdir(CARPETA, { recursive: true });
  const nombre = `${randomUUID()}.pdf`;
  await writeFile(path.join(CARPETA, nombre), archivo.buffer);
  return nombre;
}

// Ruta completa del archivo, para enviarlo con res.sendFile
// path.basename quita cualquier "../" por si el nombre guardado fuera manipulado
export async function rutaCertificado(nombre) {
  const ruta = path.join(CARPETA, path.basename(nombre));
  await access(ruta).catch(() => {
    throw new HttpError(404, 'El archivo del certificado no se encuentra');
  });
  return ruta;
}

// Borra el archivo (si no existe, no pasa nada)
export const borrarCertificado = (nombre) =>
  unlink(path.join(CARPETA, path.basename(nombre))).catch(() => {});