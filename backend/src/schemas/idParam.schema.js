import { z } from 'zod';

// Un id que llega en la URL como texto ("7"): debe ser un entero positivo y se convierte a número (7)
const idPositivo = z.string().regex(/^[1-9]\d*$/, 'El id debe ser un número entero positivo').transform(Number);

// Valida el :id de la URL
export const idParamSchema = z.object({
  id: idPositivo,
});

// Valida /:id/fotos/:idFoto (id del animal e id de la foto)
export const fotoParamSchema = z.object({
  id: idPositivo,
  idFoto: idPositivo,
});