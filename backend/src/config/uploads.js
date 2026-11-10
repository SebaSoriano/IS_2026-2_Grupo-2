import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Ruta de la carpeta donde está este archivo (backend/src/config)
const carpetaDeEsteArchivo = path.dirname(fileURLToPath(import.meta.url));

// backend/uploads: carpeta donde se guardan los archivos subidos
export const CARPETA_UPLOADS = path.join(carpetaDeEsteArchivo, '..', '..', 'uploads');

// backend/uploads/animales: fotos de los animales
export const CARPETA_FOTOS_ANIMALES = path.join(CARPETA_UPLOADS, 'animales');
export const CARPETA_EMAILS = path.join(carpetaDeEsteArchivo, '..', '..', 'public');

// Crea las carpetas si no existen (recursive: crea también "uploads" si falta)
fs.mkdirSync(CARPETA_FOTOS_ANIMALES, { recursive: true });
fs.mkdirSync(CARPETA_EMAILS, { recursive: true });