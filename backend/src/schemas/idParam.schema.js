import { crearSchema } from './validadores.js';

// Valida el :id de la URL y lo convierte de texto ("7") a número (7)
export const idParamSchema = crearSchema({
  id: {
    validar: (v) => (/^[1-9]\d*$/.test(v) ? null : 'El id debe ser un número entero positivo'),
    transformar: Number,
  },
});
